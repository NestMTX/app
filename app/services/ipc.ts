import { createServer, Socket } from 'node:net'
import { EventEmitter } from 'node:events'
import type { Server } from 'node:net'
import type { ApplicationService } from '@adonisjs/core/types'
import type { LoggerService } from '@adonisjs/core/types'
import type { Logger } from '@adonisjs/logger'

export class IPCService extends EventEmitter {
  readonly #app: ApplicationService
  readonly #server: Server
  #logger?: Logger

  constructor(app: ApplicationService) {
    super()
    this.#app = app
    this.#server = createServer((socket: Socket) => {
      this.#log.info(`IPC Client Connected`)
      socket.on('data', (raw) => {
        const asString = raw.toString()
        try {
          const data = JSON.parse(asString)
          if (!Array.isArray(data)) {
            this.#log.error(`Invalid incoming data: ${asString}. Should be array.`)
            return
          }
          const event = data.shift()
          if ('string' !== typeof event) {
            this.#log.error(
              `Invalid incoming data: ${asString}. First element should be string containing the name of the event to be emitted.`
            )
            return
          }
          this.emit(event, ...data)
          this.#log.info(`Emitted event: ${event}`)
        } catch {
          this.#log.error(`Failed to parse incoming data: ${asString}`)
          return
        }
      })
      socket.on('end', () => {
        this.#log.info(`IPC Client Disconnected`)
      })
    })
  }

  get #log() {
    if (!this.#logger) {
      return {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
        fatal: () => {},
        silent: () => {},
      }
    } else {
      return this.#logger
    }
  }

  async boot(logger: LoggerService) {
    this.#logger = logger.child({ service: 'ipc' })
    const ipcSocketPath = this.#app.tmpPath('ipc.sock')
    this.#server.listen(ipcSocketPath, () => {
      this.#log.info(`IPC Server listening on ${ipcSocketPath}`)
    })
  }

  async shutdown() {
    const promise = new Promise<void>((resolve) => {
      this.#server.on('close', () => resolve())
    })
    this.#server.close()
    return await promise
  }
}
