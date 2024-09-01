import type { ApplicationService } from '@adonisjs/core/types'
import type { LoggerServiceWithConfig } from '#services/socket.io'
import type { IClientOptions, MqttClient } from 'mqtt'
import type { Server } from 'node:net'
import { Application } from '@adonisjs/core/app'
import fs from 'node:fs/promises'
import { join } from 'node:path'
import string from '@adonisjs/core/helpers/string'
import { ApiService } from '#services/api'
import { SocketIoService } from '#services/socket.io'
import server from '@adonisjs/core/services/server'
import { DateTime } from 'luxon'
import { connect as MqttConnect } from 'mqtt'
import Joi from 'joi'
import { MqttService } from '#services/mqtt'
import { MediaMTXService } from '#services/mediamtx'
import { GStreamerService } from '#services/gstreamer'
import { NATService } from '#services/nat'
import { ICEService } from '#services/ice'
import { IPCService } from '#services/ipc'
import { MiliCron } from '@jakguru/milicron'
import { init } from '#services/cron'
import { PM3 } from '#services/pm3'
import { HttpsService } from '#services/https'
import { execa } from 'execa'

const base = new URL('../', import.meta.url).pathname

declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    'api/service': ApiService
    'socket.io/service': SocketIoService
    'mqtt/broker'?: Server
    'mqtt/client'?: MqttClient
    'mediamtx': MediaMTXService
    'gstreamer': GStreamerService
    'pm3': PM3
    'nat/service': NATService
    'ice/service': ICEService
    'ipc/service': IPCService
    'cron/service': MiliCron
    'https/service': HttpsService
  }
}

declare module '@adonisjs/core/app' {
  interface Application<ContainerBindings extends Record<any, any>> {
    apiService: ApiService
    socketIoService: SocketIoService
    mqttBroker?: Server
    mqttClient?: MqttClient
    mediamtx: MediaMTXService
    gstreamer: GStreamerService
    pm3: PM3
    natService: NATService
    iceService: ICEService
    ipcService: IPCService
    cronService: MiliCron
    httpsService: HttpsService
  }
}

export default class AppProvider {
  #api: ApiService
  #io: SocketIoService
  #mediamtx: MediaMTXService
  #gstreamer: GStreamerService
  #mqttBroker?: Server
  #mqtt?: MqttClient
  #nat: NATService
  #ice: ICEService
  #ipc: IPCService
  #cron: MiliCron
  #pm3: PM3
  #https: HttpsService
  constructor(protected app: ApplicationService) {
    this.#api = new ApiService()
    this.#io = new SocketIoService(this.app, this.#api)
    this.#mediamtx = new MediaMTXService(this.app)
    this.#gstreamer = new GStreamerService(this.app)
    this.#nat = new NATService()
    this.#ice = new ICEService()
    this.#ipc = new IPCService(this.app)
    this.#cron = new MiliCron()
    this.#pm3 = new PM3()
    this.#https = new HttpsService(this.app)
  }

  /**
   * Register bindings to the container
   */
  register() {
    this.app.container.singleton('api/service', () => this.#api)
    this.app.container.singleton('socket.io/service', () => this.#io)
    this.app.container.singleton('mqtt/broker', () => this.#mqttBroker)
    this.app.container.singleton('mqtt/client', () => this.#mqtt)
    this.app.container.singleton('mediamtx', () => this.#mediamtx)
    this.app.container.singleton('gstreamer', () => this.#gstreamer)
    this.app.container.singleton('pm3', () => this.#pm3)
    this.app.container.singleton('nat/service', () => this.#nat)
    this.app.container.singleton('ice/service', () => this.#ice)
    this.app.container.singleton('ipc/service', () => this.#ipc)
    this.app.container.singleton('cron/service', () => this.#cron)
    this.app.container.singleton('https/service', () => this.#https)
  }

  /**
   * The container bindings have booted
   */
  async boot() {
    const logger = await this.app.container.make('logger')
    const pm3Logger = logger.child({ service: 'pm3' })
    this.#pm3.on('debug', (message) => {
      pm3Logger.info(message)
    })
    const env = this.app.getEnvironment()
    if ('web' === env) {
      await this.#nat.boot(logger as LoggerServiceWithConfig)
      await this.#ice.boot(logger as LoggerServiceWithConfig)
      this.#io.boot(logger as LoggerServiceWithConfig)
      await this.#ipc.boot(logger as LoggerServiceWithConfig)
      const db = await this.app.container.make('lucid.db')
      const hash = await this.app.container.make('hash')
      logger.info('Updating Database...')
      const { stdout } = await execa('node', ['ace', 'migration:run', '--force'], { cwd: base })
      logger.info(stdout)
      const systemUserExists = await db.from('users').where('username', 'system').first()
      if (!systemUserExists) {
        await db.table('users').insert({
          id: 0,
          username: 'system',
          password: 'system',
          can_login: false,
          created_at: DateTime.utc().toSQL(),
        })
      }
      const interfaceUserExists = await db.from('users').where('username', 'nestmtx').first()
      if (!interfaceUserExists) {
        await db.table('users').insert({
          username: 'nestmtx',
          password: await hash.make('nestmtx'),
          can_login: true,
          created_at: DateTime.utc().toSQL(),
        })
      }
      logger.info('Database Updated')
    }
    if ('web' === env) {
      logger.info('Loading API Modules...')
    }
    const apiModuleDir = join(base, 'app', 'modules')
    const files = await fs.readdir(apiModuleDir)
    for (const file of files) {
      if (file.endsWith('.md')) continue
      if (file.endsWith('.map')) continue
      if ('web' === env) {
        logger.info(`Loading API Module from ${file}...`)
      }
      const { default: mod } = await import(join(apiModuleDir, file))
      const name = string.dashCase(mod.name.replace(/Module$/, ''))
      const instance = new mod(this.app)
      this.#api.modules.add(name, instance)
      if ('web' === env) {
        logger.info(`Added API Module "${name}"`)
      }
    }
    if ('web' === env) {
      const mqttConfig = this.app.config.get('mqtt')
      const mqttConfigSchema = Joi.object<IClientOptions>({
        clientId: Joi.string().required(),
        protocol: Joi.string()
          .required()
          .allow('wss', 'ws', 'mqtt', 'mqtts', 'tcp', 'ssl', 'wx', 'wxs', 'ali', 'alis'),
        host: Joi.alternatives()
          .try(Joi.string().hostname(), Joi.string().valid(':instance:'))
          .required(),
        port: Joi.number().required().min(1).max(65535).default(1883),
        username: Joi.string().optional(),
        password: Joi.string().optional(),
        manualConnect: Joi.boolean().optional(),
      })
      const { value, error } = mqttConfigSchema.validate(mqttConfig)
      if (!error) {
        if (value.host === ':instance:') {
          logger.info('Starting local MQTT Broker...')
          this.#mqttBroker = MqttService.serve(value.port!, logger)
          value.host = '127.0.0.1'
        }
        this.#mqtt = MqttConnect(value)
      } else {
        logger.error('Invalid MQTT Configuration. Not connecting to MQTT Server.')
      }
      await this.#mediamtx.boot(logger, this.#nat, this.#ice, this.#pm3)
      await this.#gstreamer.boot(logger, this.#nat, this.#ice, this.#pm3, this.#ipc)
      this.#cron.$on('*/5 * * * * *', this.#mediamtx.cron.bind(this.#mediamtx))
      await init(this.app, this.#cron, logger as LoggerServiceWithConfig)
    }
    Application.getter('apiService', () => this.#api)
    Application.getter('socketIoService', () => this.#io)
    Application.getter('mqttBroker', () => this.#mqttBroker)
    Application.getter('mqttClient', () => this.#mqtt)
    Application.getter('mediamtx', () => this.#mediamtx)
    Application.getter('gstreamer', () => this.#gstreamer)
    Application.getter('pm3', () => this.#pm3)
    Application.getter('natService', () => this.#nat)
    Application.getter('iceService', () => this.#ice)
    Application.getter('ipcService', () => this.#ipc)
    Application.getter('cronService', () => this.#cron)
    Application.getter('httpsService', () => this.#https)
  }

  /**
   * The application has been booted
   */
  async start() {
    const logger = await this.app.container.make('logger')
    const env = this.app.getEnvironment()
    if ('web' === env) {
      logger.info('Starting Cron Service...')
      this.#cron.start()
    }
  }

  /**
   * The process has been started
   */
  async ready() {
    const logger = await this.app.container.make('logger')
    const env = this.app.getEnvironment()
    if ('web' === env) {
      await this.#io.start(server)
      logger.info('Socket.IO Server Attached')
      await this.#https.boot(logger as LoggerServiceWithConfig)
    }
    if (this.#mqtt) {
      new MqttService(this.#api, this.#mqtt, logger)
    }
  }

  /**
   * Preparing to shutdown the app
   */
  async shutdown() {
    const logger = await this.app.container.make('logger')
    const env = this.app.getEnvironment()
    if ('web' === env) {
      await this.#https.shutdown()
      this.#cron.$off('*/5 * * * * *', this.#mediamtx.cron.bind(this.#mediamtx))
      logger.info('Shutting down child processes')
      await this.#pm3.kill()
      logger.info('Shutting down Cron Service...')
      this.#cron.stop()
      await this.#ipc.shutdown()
    }
  }
}
