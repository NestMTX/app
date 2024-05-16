import type { ApplicationService } from '@adonisjs/core/types'
import type server from '@adonisjs/core/services/server'
import type { Socket } from 'socket.io'
import type User from '#models/user'
import type { ApiService, CommandContext } from '#services/api'
import type { LoggerService } from '@adonisjs/core/types'
import type { Readable } from 'node:stream'
import { Server as SocketIoServer } from 'socket.io'
import { Secret } from '@adonisjs/core/helpers'
import Joi from 'joi'
import { ApiServiceRequestError } from '#services/api'
import { inspect } from 'node:util'
import fs from 'node:fs/promises'
import { existsSync, createReadStream } from 'node:fs'
import { execa } from 'execa'

type HttpServerService = typeof server

type RequestPayload = Omit<CommandContext, 'user'>

export type LoggerServiceWithConfig = LoggerService & {
  config: any
}

const requestPayloadSchema = Joi.object({
  command: Joi.string().valid('list', 'read', 'create', 'update', 'delete').required(),
  module: Joi.string().required(),
  requestId: Joi.string().required(),
  payload: Joi.alternatives().conditional('command', {
    switch: [
      { is: 'create', then: Joi.object().required() },
      { is: 'update', then: Joi.object().required() },
    ],
    otherwise: Joi.forbidden(),
  }),
})

export interface AppSocket extends Socket {
  user?: User
  respondToRequest?: (requestId: string, response: any) => void
}

export class SocketIoService {
  #io: SocketIoServer
  #logger?: LoggerService
  readonly #app: ApplicationService
  readonly #api: ApiService
  readonly #sockets: Map<string, AppSocket>
  readonly #loggerFifoPath: string
  #loggerFifoStream?: Readable

  constructor(app: ApplicationService, api: ApiService) {
    this.#app = app
    this.#sockets = new Map()
    this.#api = api
    this.#io = new SocketIoServer({
      addTrailingSlash: true,
      allowEIO3: true,
      transports: ['websocket', 'polling'],
    })
    this.#io.use(this.#hooksMiddleware.bind(this))
    this.#io.use(this.#authenticationMiddleware.bind(this))
    this.#io.on('connection', this.#onIncomingConnection.bind(this))
    this.#loggerFifoPath = this.#app.tmpPath('logger.sock')
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

  /**
   * @private
   */
  boot(logger: LoggerServiceWithConfig) {
    this.#logger = logger
    // logger.config.transport.targets.push
  }

  /**
   * @private
   */
  async start(httpServerService: HttpServerService) {
    const server = httpServerService.getNodeServer()
    if (!server) {
      return
    }
    await Promise.all([this.#makeFifo(this.#loggerFifoPath)])
    this.#loggerFifoStream = createReadStream(this.#loggerFifoPath)
    this.#io.attach(server)
    this.#loggerFifoStream.on('data', (chunk) => {
      try {
        const obj = JSON.parse(chunk.toString())
        console.log({ obj })
        this.broadcast('log', obj)
      } catch {
        this.#log.error(`Failed to parse log message: ${chunk.toString()}`)
      }
    })
  }

  #hooksMiddleware(socket: AppSocket, next: (err?: Error) => void) {
    socket.respondToRequest = (requestId, response) => {
      socket.emit(requestId, response)
    }
    return next()
  }

  #authenticationMiddleware(socket: AppSocket, next: (err?: Error) => void) {
    let token: string | undefined
    if (socket.handshake.headers && socket.handshake.headers.authorization) {
      token = socket.handshake.headers.authorization.replace(/^Bearer /, '')
    } else if (socket.handshake.auth && socket.handshake.auth.token) {
      token = socket.handshake.auth.token
    } else if (socket.handshake.query && 'string' === typeof socket.handshake.query.token) {
      token = socket.handshake.query.token
    }
    if (token) {
      const bearerToken = new Secret(token)
      console.log({ bearerToken })
      const err = new Error('Authorization is not yet enabled')
      return next(err)
    }
    return next()
  }

  #onIncomingConnection(socket: AppSocket) {
    this.#sockets.set(socket.id, socket)
    this.#log.info(`Socket ${socket.id} connected`)
    socket.on('request', this.#onRequest.bind(this, socket))
    socket.on('disconnect', () => {
      this.#log.info(`Socket ${socket.id} disconnected`)
      this.#sockets.delete(socket.id)
    })
  }

  async #onRequest(socket: AppSocket, payload: unknown) {
    if ('string' === typeof payload) {
      try {
        payload = JSON.parse(payload)
      } catch {
        // Do nothing
      }
    }
    this.#log.info(
      `Got request from ${socket.id} with payload: ${inspect(payload, false, 20, true)}`
    )
    let request: RequestPayload | undefined
    try {
      await requestPayloadSchema.validateAsync(payload)
      request = payload as RequestPayload
    } catch (err) {
      if (
        'object' === typeof request &&
        null !== request &&
        'string' === typeof request.requestId
      ) {
        return socket.respondToRequest!(request.requestId, {
          error: {
            message: 'Invalid Request',
            details: err.details,
            context: request,
          },
        })
      } else {
        return socket.emit('failure', {
          message: 'Invalid Request',
          details: err.details,
          context: request,
        })
      }
    }
    const ctx: CommandContext = { ...request!, user: socket.user } as CommandContext
    const res = await this.#api.handle(ctx as CommandContext)
    if (res instanceof Error) {
      if (res instanceof ApiServiceRequestError) {
        return socket.respondToRequest!(ctx.requestId, {
          error: {
            message: res.message,
            details: res.details,
            context: ctx,
          },
        })
      }
      return socket.respondToRequest!(ctx.requestId, {
        error: {
          message: res.message,
          details: [],
          context: ctx,
        },
      })
    }
    return socket.respondToRequest!(ctx.requestId, res)
  }

  broadcast(event: string, ...args: any[]) {
    this.#io.emit(event, ...args)
  }

  async #makeFifo(path: string) {
    if (existsSync(path)) {
      await fs.unlink(path)
    }
    await execa('mkfifo', [path])
  }
}
