import env from '#start/env'
import preconfigured from '#config/ice'
import joi from 'joi'
import Twilio from 'twilio'
import { logger as main } from '#services/logger'

import type { LoggerService } from '@adonisjs/core/types'
import type { RTCIceServer } from 'werift'
import type winston from 'winston'

interface IceServer {
  url?: string
  urls?: string
  username?: string
  password?: string
}

export class IceCandidateError extends Error {
  readonly address: string
  readonly errorCode: number
  readonly errorText: string
  readonly port: number
  readonly url: string

  constructor(address: string, errorCode: number, errorText: string, port: number, url: string) {
    super(`ICE Candidate Error: ${errorText}`)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
    this.address = address
    this.errorCode = errorCode
    this.errorText = errorText
    this.port = port
    this.url = url
  }
}

export class ICEService {
  readonly #known: Set<IceServer> = new Set<any>()
  readonly #logger: winston.Logger

  constructor() {
    this.#logger = main.child({ service: 'ice' })
    preconfigured.forEach((server) => {
      this.#known.add(server)
    })
  }

  async boot(_logger: LoggerService) {
    const loadIceServersFromTwilio = env.get('ICE_USE_TWILIO', false)
    if (loadIceServersFromTwilio) {
      this.#logger.info('Loading ICE servers from Twilio')
      const config = {
        TWILIO_ACCOUNT_SID: env.get('TWILIO_ACCOUNT_SID'),
        TWILIO_API_KEY_SID: env.get('TWILIO_API_KEY_SID'),
        TWILIO_API_KEY_SECRET: env.get('TWILIO_API_KEY_SECRET'),
      }
      const configSchema = joi.object({
        TWILIO_ACCOUNT_SID: joi.string().required(),
        TWILIO_API_KEY_SID: joi.string().required(),
        TWILIO_API_KEY_SECRET: joi.string().required(),
      })
      const { error } = configSchema.validate(config)
      if (error) {
        throw error
      }
      const twilio: Twilio.Twilio = Twilio(
        config.TWILIO_API_KEY_SID,
        config.TWILIO_API_KEY_SECRET,
        {
          accountSid: config.TWILIO_ACCOUNT_SID,
        }
      ) as Twilio.Twilio
      try {
        const { iceServers } = await twilio.tokens.create()
        if (iceServers) {
          this.#logger.info('Loaded ICE servers from Twilio')
          iceServers.forEach((server) => {
            const toAdd = {
              url: server.url,
              urls: server.urls,
              username: server.username,
              password: server.credential,
            }
            this.#known.add(toAdd)
          })
        }
      } catch (err) {
        this.#logger.error(`Failed to load ICE servers from Twilio: ${err.message}`)
      }
    }
    this.#logger.info('Loading Preconfigured ICE servers')
    preconfigured.forEach((server) => this.#known.add(server))
  }

  get asMediaMtxIceServers() {
    return [...this.#known]
      .map((s) => ({ ...s, urls: undefined }))
      .filter((s) => s.url) as IceServer[]
  }

  get asRTCIceServers() {
    return [...this.#known]
      .map((s) => ({ ...s, url: undefined }))
      .filter((s) => s.urls) as RTCIceServer[]
  }
}
