import type { ApplicationService } from '@adonisjs/core/types'
import type server from '@adonisjs/core/services/server'
import type { Socket } from 'socket.io'
import type User from '#models/user'
import type { ApiService, CommandContext } from '#services/api'
import type { LoggerService } from '@adonisjs/core/types'
import type { Logger } from '@adonisjs/logger'
import type { AuthManager } from '@adonisjs/auth'
import type { Authenticators } from '@adonisjs/auth/types'
import { Server as SocketIoServer } from 'socket.io'
import { Secret } from '@adonisjs/core/helpers'
import Joi from 'joi'
import { ApiServiceRequestError } from '#services/api'
import { inspect } from 'node:util'
import logEmitter from '#services/emitter.log'
import { tokensUserProvider } from '@adonisjs/auth/access_tokens'

type HttpServerService = typeof server

type RequestPayload = Omit<CommandContext, 'user'>

type UserProvider = ReturnType<typeof tokensUserProvider>

export type LoggerServiceWithConfig = LoggerService & {
  config: any
}

const requestPayloadSchema = Joi.object({
  command: Joi.string().valid('list', 'read', 'create', 'update', 'delete').required(),
  module: Joi.string().required(),
  requestId: Joi.string().required(),
  entity: Joi.alternatives().conditional('command', {
    switch: [
      { is: 'read', then: Joi.string().required() },
      { is: 'update', then: Joi.string().required() },
      { is: 'delete', then: Joi.string().required() },
    ],
    otherwise: Joi.forbidden(),
  }),
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

export interface PinoLog {
  [key: string]: any
  level: number
  time: number
  pid: number
  hostname: string
  msg: string
  service?: string
}

export class SocketIoService {
  #io: SocketIoServer
  #logger?: Logger
  #auth?: AuthManager<Authenticators>
  readonly #app: ApplicationService
  readonly #api: ApiService
  readonly #sockets: Map<string, AppSocket>
  readonly #logs: PinoLog[] = []
  readonly #userProvider: UserProvider

  constructor(app: ApplicationService, api: ApiService) {
    this.#app = app
    this.#sockets = new Map()
    this.#api = api
    this.#userProvider = tokensUserProvider({
      tokens: 'accessTokens',
      // @ts-ignore it works - shutup!
      model: () => import('#models/user'),
    })
    this.#io = new SocketIoServer({
      addTrailingSlash: true,
      allowEIO3: true,
      transports: ['websocket', 'polling'],
    })
    this.#io.use(this.#hooksMiddleware.bind(this))
    this.#io.use(this.#authenticationMiddleware.bind(this))
    this.#io.on('connection', this.#onIncomingConnection.bind(this))
    logEmitter.on('log', this.broadcast.bind(this, 'log'))
    logEmitter.on('log', (log) => this.#pushLog(log))
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
    this.#logger = logger.child({ service: 'socket.io' })
  }

  /**
   * @private
   */
  async start(httpServerService: HttpServerService) {
    this.#auth = await this.#app.container.make('auth.manager')
    const server = httpServerService.getNodeServer()
    if (!server) {
      return
    }
    this.#io.attach(server)
  }

  #hooksMiddleware(socket: AppSocket, next: (err?: Error) => void) {
    socket.respondToRequest = (requestId, response) => {
      socket.emit(requestId, response)
    }
    return next()
  }

  async #authenticationMiddleware(socket: AppSocket, next: (err?: Error) => void) {
    if (!this.#auth) {
      const err = new Error('Authorization is not yet enabled')
      return next(err)
    }
    let token: string | undefined
    if (socket.handshake.headers && socket.handshake.headers.authorization) {
      token = socket.handshake.headers.authorization.replace(/^Bearer /, '')
    } else if (socket.handshake.auth && socket.handshake.auth.token) {
      token = socket.handshake.auth.token
    } else if (socket.handshake.query && 'string' === typeof socket.handshake.query.token) {
      token = socket.handshake.query.token
    }
    let user: User | undefined
    if (token) {
      const bearerToken = new Secret(token)
      const t = await this.#userProvider.verifyToken(bearerToken)
      if (!t) {
        return next()
      }
      const providerUser = await this.#userProvider.findById(t.tokenableId)
      if (!providerUser) {
        return next()
      }
      user = providerUser.getOriginal() as User
    }
    socket.user = user
    return next()
  }

  #onIncomingConnection(socket: AppSocket) {
    this.#sockets.set(socket.id, socket)
    this.#logs.forEach((log) => socket.emit('log', log))
    this.#log.info(`Socket ${socket.id} connected`)
    socket.on('request', this.#onRequest.bind(this, socket))
    socket.on('disconnect', () => {
      this.#log.info(`Socket ${socket.id} disconnected`)
      this.#sockets.delete(socket.id)
    })
  }

  #pushLog(log: PinoLog) {
    this.#logs.push(log)
    while (this.#logs.length > 100) {
      this.#logs.shift()
    }
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
}
