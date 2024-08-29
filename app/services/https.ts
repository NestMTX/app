import env from '#start/env'
import https from 'node:https'
import HttpProxy from 'http-proxy'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { execa } from 'execa'
import { resolve } from 'node:path'
import { DateTime } from 'luxon'

import type { ApplicationService } from '@adonisjs/core/types'
import type { LoggerService } from '@adonisjs/core/types'
import type { Logger } from '@adonisjs/logger'
import type { Server } from 'node:https'

export class HttpsService {
  readonly #app: ApplicationService
  readonly #httpsPort: number
  readonly #httpsCertPath: string
  readonly #httpsKeyPath: string
  #logger?: Logger
  #proxy?: HttpProxy
  #server?: Server

  constructor(app: ApplicationService) {
    this.#app = app
    this.#httpsPort = env.get('HTTPS_PORT', 2001)
    this.#httpsCertPath = this.#getCertPath(env.get('HTTPS_CERT_PATH', 'nestmtx.crt'))
    this.#httpsKeyPath = this.#getCertPath(env.get('HTTPS_KEY_PATH', 'nestmtx.pem'))
  }

  #getCertPath(raw: string) {
    if (raw.startsWith('/')) {
      return raw
    } else {
      return this.#app.tmpPath(raw)
    }
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
    this.#logger = logger.child({ service: 'https' })
    this.#log.info(`Checking for SSL Certificates...`)
    const certExists = existsSync(this.#httpsCertPath)
    const keyExists = existsSync(this.#httpsKeyPath)
    const missing = !certExists || !keyExists
    let generate = false
    if (missing) {
      if (!certExists) {
        this.#log.warn(`Certificate file not found: ${this.#httpsCertPath}`)
      }
      if (!keyExists) {
        this.#log.warn(`Key file not found: ${this.#httpsKeyPath}`)
      }
      generate = true
    } else {
      this.#log.info(`SSL Certificates found. Checking expiration...`)
      const { stdout: certificateExpirationResponse } = await execa('openssl', [
        'x509',
        '-enddate',
        '-noout',
        '-in',
        this.#httpsCertPath,
      ])
      const notAfter = certificateExpirationResponse.replace('notAfter=', '')
      const notAfterDateTime = DateTime.fromFormat(notAfter, 'MMM d HH:mm:ss yyyy ZZZZ')
      const now = DateTime.utc()
      if (now > notAfterDateTime) {
        this.#log.warn(`Certificate expired on ${notAfter}. SSL Cerficates will be regenerated.`)
        generate = true
      } else {
        this.#log.info(`Certificate expires on ${notAfter}. SSL Certificates are valid.`)
      }
    }
    if (generate) {
      this.#log.info(`Generating SSL Certificates...`)
      // make sure that the ~/.rnd file exists
      const pathToRnd = resolve(env.get('HOME'), '.rnd')
      await execa('touch', [pathToRnd])
      await execa('openssl', [
        'req',
        '-x509',
        '-nodes',
        '-days',
        '365',
        '-newkey',
        'rsa:2048',
        '-keyout',
        this.#httpsKeyPath,
        '-out',
        this.#httpsCertPath,
        '-subj',
        '/C=US/ST=Denial/L=Springfield/O=Dis/CN=example.com',
      ])
    }
    this.#log.info(`Loading SSL Certificates...`)
    const [cert, key] = await Promise.all([
      readFile(this.#httpsCertPath, 'utf-8'),
      readFile(this.#httpsKeyPath, 'utf8'),
    ])
    this.#log.info(`Starting HTTPS`)
    this.#proxy = HttpProxy.createProxyServer({
      target: {
        host: '127.0.0.1',
        port: env.get('PORT', 2000),
      },
    })
    this.#proxy.on('error', (err) => {
      this.#log.error(err)
    })
    this.#server = https.createServer({ cert, key }, (req, res) => {
      this.#proxy!.web(req, res)
    })
    this.#server.on('upgrade', (req, socket, head) => {
      this.#proxy!.ws(req, socket, head)
    })
    this.#server.listen(this.#httpsPort, () => {
      this.#log.info(`HTTPS Server listening on port ${this.#httpsPort}`)
    })
  }

  async shutdown() {}
}
