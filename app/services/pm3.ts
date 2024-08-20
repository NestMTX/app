/**
 * PM3 - A Process Management Service based around Execa
 */
import { execa } from 'execa'
import { EventEmitter } from 'node:events'
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
    this.#desired.set(name, desired)
    this.#abortControllers.set(name, abortController)
    if (start) {
      return await this.start(name)
    }
  }

  async start(name: string) {
    if (!this.#desired.has(name)) {
      throw new PM3NoSuchProcess(name)
    }
    // @todo: Implement
  }

  async stop(name: string) {}

  async restart(name: string) {}

  async remove(name: string) {}

  emit(): never {
    throw new Error('PM3 does not support emitting events')
  }
}
