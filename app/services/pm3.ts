/**
 * PM3 - A Process Management Service based around Execa
 * & pidusage for process information
 */
import { execa } from 'execa'
import { EventEmitter } from 'node:events'
import pidusage from 'pidusage'
import type { ExecaChildProcess, Options as ProcessOptions } from 'execa'

interface DesiredProcess {
  file: string
  arguments: string[]
  options: ProcessOptions
}

export interface PM3ProcessOptions {
  name: string
  file: string
  arguments?: string[]
  cwd?: string | URL
  extendEnv?: boolean
  env?: NodeJS.ProcessEnv
  uid?: number
  gid?: number
  signal?: AbortSignal
  verbose?: boolean
  restart?: boolean
  maxRestarts?: number
}

export interface PM3ProcessEventMap {
  /**
   * `stdout:<name>` - Emitted when a process writes to stdout
   */
  [event: `stdout:${string}`]: [string]
  /**
   * `stderr:<name>` - Emitted when a process writes to stderr
   */
  [event: `stderr:${string}`]: [string]
  /**
   * `error:<name>` - Emitted when a process writes to stderr
   */
  [event: `error:${string}`]: [string]
  'log:out': [string, string]
  'log:err': [string, string]
  'caught:error': [string, string]
  'debug': [string]
}

export interface PM3SyncProcessInformation {
  name: string
  pid: number | null
}

export interface PM3ProcessInformation extends PM3SyncProcessInformation {
  cpu: number | null
  memory: number | null
  uptime: number | null
}

export class PM3ProcessAlreadyExistsError extends Error {
  constructor(name: string) {
    super(`Process with name "${name}" already exists`)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class PM3NoSuchProcess extends Error {
  constructor(name: string) {
    super(`No Process with name "${name}" exists`)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class PM3 extends EventEmitter<PM3ProcessEventMap> {
  readonly #options: Map<string, PM3ProcessOptions>
  readonly #desired: Map<string, DesiredProcess>
  readonly #processes: Map<string, ExecaChildProcess>
  readonly #abortControllers: Map<string, AbortController>

  constructor() {
    super({ captureRejections: true })
    this.#options = new Map()
    this.#desired = new Map()
    this.#processes = new Map()
    this.#abortControllers = new Map()
  }

  get processes(): PM3SyncProcessInformation[] {
    return [...this.#desired].map(([name]) => {
      const process = this.#processes.get(name)
      return { name, pid: process && process.pid ? process.pid : null }
    })
  }

  async stats(): Promise<PM3ProcessInformation[]> {
    return await Promise.all(
      this.processes.map(async (op) => {
        const ret: PM3ProcessInformation = {
          ...op,
          cpu: null,
          memory: null,
          uptime: null,
        }
        if (!op.pid) {
          return ret
        }
        try {
          const usage = await pidusage(op.pid)
          ret.cpu = usage.cpu
          ret.memory = usage.memory
          ret.uptime = usage.elapsed
        } catch {
          // noop
        }
        return ret
      })
    )
  }

  async add(name: string, options: Omit<PM3ProcessOptions, 'name'>, start: boolean = false) {
    if (this.#desired.has(name)) {
      if (!start) {
        throw new PM3ProcessAlreadyExistsError(name)
      }
      return await this.start(name)
    }
    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        const abortController = this.#abortControllers.get(name)
        if (abortController) {
          abortController.abort()
        }
      })
    }
    const opts: ProcessOptions = {
      cwd: options.cwd,
      cleanup: true,
      buffer: false,
      stdin: 'pipe',
      stdout: 'pipe',
      stderr: 'pipe',
      reject: false,
      stripFinalNewline: true,
      extendEnv:
        'undefined' === typeof options.extendEnv || true === options.extendEnv ? true : false,
      env: options.env,
      detached: false,
      uid: options.uid,
      gid: options.gid,
      shell: false,
      timeout: 0,
      verbose: options.verbose,
    }
    const desired: DesiredProcess = {
      file: options.file,
      arguments: options.arguments || [],
      options: opts,
    }
    await this.#cleanup(name)
    this.#options.set(name, { name, ...options })
    this.#desired.set(name, desired)
    if (start) {
      return this.start(name)
    }
  }

  start(name: string) {
    this.#start(name)
  }

  #start(name: string, attempt: number = 0) {
    this.#debug(`Starting process: ${name}`)
    const desired = this.#desired.get(name)
    const options = this.#options.get(name)
    if (!desired || !options) {
      this.#debug(`Missing process information for: ${name}`)
      throw new PM3NoSuchProcess(name)
    }
    let process = this.#processes.get(name)
    if (!process || process.exitCode !== null) {
      this.#debug(`Starting new process: ${name}`)
      const abortController = new AbortController()
      this.#abortControllers.set(name, abortController)
      desired.options = {
        ...desired.options,
        signal: abortController.signal,
      }
      process = execa(desired.file, desired.arguments, desired.options)
      process.on('exit', () => {
        const restartable = 'undefined' === typeof options.restart || true === options.restart
        const maxRestarts =
          'number' === typeof options.maxRestarts && options.maxRestarts > 0
            ? options.maxRestarts
            : Number.POSITIVE_INFINITY
        if (restartable && attempt < maxRestarts) {
          this.#start(name, attempt + 1)
        }
      })
      process.catch((e) => {
        this.#onError(name, e)
      })
      if (process.stdout) {
        process.stdout.on('data', (chunk) => this.#onStdOut(name, chunk))
        process.stdout.on('error', (error) => this.#onError(name, error))
      }
      if (process.stderr) {
        process.stderr.on('data', (chunk) => this.#onStdErr(name, chunk))
        process.stderr.on('error', (error) => this.#onError(name, error))
      }
      process.on('error', (error) => this.#onError(name, error))
      this.#processes.set(name, process)
    } else {
      this.#debug(`Process for ${name} is already running`)
    }
  }

  async stop(name: string, signal: NodeJS.Signals | number = 'SIGTERM') {
    this.#debug(`Stopping process: ${name}`)
    if (!this.#desired.has(name)) {
      this.#debug(`No process with name ${name} exists`)
      throw new PM3NoSuchProcess(name)
    }
    const process = this.#processes.get(name)
    const abortController = this.#abortControllers.get(name)
    if (!process || !abortController) {
      this.#debug(`Process for ${name} is not running`)
      return
    }
    this.#debug(`Killing process: ${name}`)
    process.kill(signal)
    await process
    this.#debug(`Cleaning up process: ${name}`)
    this.#processes.delete(name)
    this.#abortControllers.delete(name)
  }

  async restart(name: string) {
    this.#debug(`Restarting process: ${name}`)
    await this.stop(name)
    await this.start(name)
    this.#debug(`Restarted process: ${name}`)
  }

  async remove(name: string) {
    try {
      await this.stop(name)
    } catch {
      // noop
    }
    await this.#cleanup(name)
  }

  async kill(signal: NodeJS.Signals | number = 'SIGTERM') {
    await Promise.all(
      [...this.#processes].map(async ([name]) => {
        await this.stop(name, signal)
      })
    )
  }

  emit(): never {
    throw new Error('PM3 does not support emitting events')
  }

  async #cleanup(name: string) {
    const process = this.#processes.get(name)
    const abortController = this.#abortControllers.get(name)
    if (abortController) {
      abortController.abort()
    }
    if (process) {
      try {
        process.kill()
      } catch {
        // noop
      }
      await process
    }
    this.#processes.delete(name)
    this.#desired.delete(name)
    this.#abortControllers.delete(name)
  }

  #onStdOut(name: string, chunk: Buffer) {
    this.#onOutput(name, chunk, 'stdout')
  }

  #onStdErr(name: string, chunk: Buffer) {
    this.#onOutput(name, chunk, 'stderr')
  }

  #onError(name: string, error: Error) {
    if (error.message.includes('The operation was aborted')) {
      return
    }
    this.#onOutput(name, Buffer.from(error.stack!), 'error')
  }

  #onOutput(name: string, chunk: Buffer, type: 'stdout' | 'stderr' | 'error') {
    let logtype: 'log:out' | 'log:err' | 'caught:error'
    switch (type) {
      case 'stderr':
        logtype = 'log:err'
        break

      case 'error':
        logtype = 'caught:error'
        break

      default:
        logtype = 'log:out'
        break
    }
    chunk
      .toString()
      .split('\n')
      .filter((l: string) => l.trim().length > 0)
      .forEach((l: string) => {
        super.emit(`${type}:${name}`, l)
        super.emit(logtype, name, l)
      })
  }

  #debug(message: string) {
    super.emit('debug', message)
  }
}
