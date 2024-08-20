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
  'log:out': [string, string]
  'log:err': [string, string]
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
  readonly #desired: Map<string, DesiredProcess>
  readonly #processes: Map<string, ExecaChildProcess>
  readonly #abortControllers: Map<string, AbortController>

  constructor() {
    super({ captureRejections: true })
    this.#desired = new Map()
    this.#processes = new Map()
    this.#abortControllers = new Map()
  }

  get processes(): PM3SyncProcessInformation[] {
    return [...this.#processes].map(([name, process]) => ({
      name,
      pid: process.pid || null,
    }))
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
        const usage = await pidusage(op.pid)
        ret.cpu = usage.cpu
        ret.memory = usage.memory
        ret.uptime = usage.elapsed
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
    const abortController = new AbortController()
    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        abortController.abort()
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
      signal: abortController.signal,
      verbose: options.verbose,
    }
    const desired: DesiredProcess = {
      file: options.file,
      arguments: options.arguments || [],
      options: opts,
    }
    await this.#cleanup(name)
    this.#desired.set(name, desired)
    this.#abortControllers.set(name, abortController)
    if (start) {
      return this.start(name)
    }
  }

  start(name: string) {
    const desired = this.#desired.get(name)
    if (!desired) {
      throw new PM3NoSuchProcess(name)
    }
    let process = this.#processes.get(name)
    if (!process || process.exitCode !== null) {
      process = execa(desired.file, desired.arguments, desired.options)
      if (process.stdout) {
        process.stdout.on('data', (chunk) => this.#onStdOut(name, chunk))
      }
      if (process.stderr) {
        process.stderr.on('data', (chunk) => this.#onStdErr(name, chunk))
      }
      this.#processes.set(name, process)
    }
  }

  async stop(name: string, signal: NodeJS.Signals | number = 'SIGTERM') {
    if (!this.#desired.has(name)) {
      throw new PM3NoSuchProcess(name)
    }
    const process = this.#processes.get(name)
    const abortController = this.#abortControllers.get(name)
    if (!process || !abortController) {
      throw new PM3NoSuchProcess(name)
    }
    process.kill(signal)
    abortController.abort()
    await process
  }

  async restart(name: string) {
    await this.stop(name)
    await this.start(name)
  }

  async remove(name: string) {
    try {
      await this.stop(name)
    } catch {
      // noop
    }
    await this.#cleanup(name)
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

  #onOutput(name: string, chunk: Buffer, type: 'stdout' | 'stderr') {
    let logtype: 'log:out' | 'log:err'
    switch (type) {
      case 'stderr':
        logtype = 'log:err'
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
}
