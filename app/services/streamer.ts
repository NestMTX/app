import env from '#start/env'
import { execa } from 'execa'
import Camera from '#models/camera'
import string from '@adonisjs/core/helpers/string'
import { Server as StreamPrivateApiServer } from 'socket.io'
import { pickPort } from '#utilities/ports'
import type { PM3 } from '#services/pm3'
import type { ApplicationService } from '@adonisjs/core/types'
import type { LoggerService } from '@adonisjs/core/types'
import type { Logger } from '@adonisjs/logger'
import type { NATService } from '#services/nat'
import type { ICEService } from '#services/ice'
import type { IPCService } from '#services/ipc'

interface DemandEventPayload {
  MTX_PATH: string
  MTX_QUERY: string
  RTSP_PORT: string
}

interface ReadyEventPayload extends DemandEventPayload {
  MTX_SOURCE_TYPE: string
  MTX_SOURCE_ID: string
}

interface ReadEventPayload extends DemandEventPayload {
  MTX_READER_TYPE: string
  MTX_READER_ID: string
}

/**
 * A class for managing the MediaMTX service process
 */
export class StreamerService {
  readonly #app: ApplicationService
  readonly #managedProcesses: Set<string>
  readonly #shuttingDownProcesses: Set<string>
  readonly #internalApiPort: number

  #logger?: Logger
  #ffmpegHwAccelerator?: string
  #ffmpegHwAcceleratorDevice?: string

  #internalApiServer?: StreamPrivateApiServer

  constructor(app: ApplicationService) {
    this.#app = app
    this.#managedProcesses = new Set()
    this.#shuttingDownProcesses = new Set()
    this.#internalApiPort = env.get('INTERNAL_API_PORT', 62005)
  }

  get managedProcesses() {
    return [...this.#managedProcesses]
  }

  get shuttingDownProcesses() {
    return [...this.#shuttingDownProcesses]
  }

  get ffmpegHwAccelerator() {
    return this.#ffmpegHwAccelerator
  }

  get ffmpegHwAcceleratorDevice() {
    return this.#ffmpegHwAcceleratorDevice
  }

  async boot(logger: LoggerService, _nat: NATService, _ice: ICEService, pm3: PM3, ipc: IPCService) {
    this.#logger = logger.child({ service: 'streamer' })
    const gstreamerBinary = env.get('GSTREAMER_BIN', 'gst-launch-1.0')
    const ffmpegBinary = env.get('FFMPEG_BIN', 'ffmpeg')
    this.#logger.info(`Checking for GStreamer Binary`)
    try {
      await execa(gstreamerBinary, ['--version'])
    } catch {
      throw new Error(`GStreamer binary not found`)
    }
    this.#logger.info(`GStreamer Binary Confirmed`)
    this.#logger.info(`Checking for FFmpeg Binary`)
    try {
      await execa(ffmpegBinary, ['-version'])
    } catch {
      throw new Error(`FFmpeg binary not found`)
    }
    this.#logger.info(`FFmpeg Binary Confirmed`)
    const ffmpegHwAccelerator = env.get('FFMPEG_HW_ACCELERATOR')
    const ffmpegHwAcceleratorDevice = env.get('FFMPEG_HW_ACCELERATOR_DEVICE')
    if (ffmpegHwAccelerator) {
      const availableHwAccelerators = await this.#getAvailableHwAccelerators()
      if (availableHwAccelerators.includes(ffmpegHwAccelerator)) {
        this.#ffmpegHwAccelerator = ffmpegHwAccelerator
        this.#ffmpegHwAcceleratorDevice = ffmpegHwAcceleratorDevice
        this.#logger.info(`FFmpeg HW Accelerator "${ffmpegHwAccelerator}" is available`)
      } else {
        this.#logger.error(
          `FFmpeg HW Accelerator "${ffmpegHwAccelerator}" is not available and will not be used`
        )
      }
    }
    ipc.on('demand', this.#onDemand.bind(this))
    ipc.on('unDemand', this.#onUnDemand.bind(this))
    ipc.on('ready', this.#onReady.bind(this))
    ipc.on('notReady', this.#onNotReady.bind(this))
    ipc.on('read', this.#onRead.bind(this))
    ipc.on('unread', this.#onUnread.bind(this))
    this.#logger.info(`Streamer Service booted`)
    pm3.on('log:out', this.#logProcessToInfo)
    pm3.on('log:err', this.#logProcessToWarn)

    pm3.on('stdout:nestmtx-static-no-such-camera', this.#logToInfo)
    pm3.on('stderr:nestmtx-static-no-such-camera', this.#logToError)
    pm3.on('stdout:nestmtx-static-camera-disabled', this.#logToInfo)
    pm3.on('stderr:nestmtx-static-camera-disabled', this.#logToError)
    pm3.on('stdout:nestmtx-static-connecting', this.#logToInfo)
    pm3.on('stderr:nestmtx-static-connecting', this.#logToError)
    this.#internalApiServer = new StreamPrivateApiServer({
      serveClient: false,
      allowEIO3: true,
      transports: ['websocket', 'polling'],
    })
    this.#internalApiServer.on('connection', (socket) => {
      this.#logger?.info(`Got connection from socket ${socket.id}`)
      socket.emit('ice', this.#app.iceService.asRTCIceServers)
      socket.emit('hosts', [
        '127.0.0.1',
        '::1',
        ...this.#app.natService.lanIps,
        this.#app.natService.publicIp,
      ])
    })
    this.#internalApiServer.listen(this.#internalApiPort)
    this.#logger.info(`Streamer Service API listening on port ${this.#internalApiPort}`)
  }

  async cronjob() {}

  async #getAvailableHwAccelerators() {
    const ffmpegBinary = env.get('FFMPEG_BIN', 'ffmpeg')
    const { stdout } = await execa(ffmpegBinary, ['-hwaccels'])
    return stdout
      .split('\n')
      .filter((line) => line.length > 0)
      .map((line) => line.trim())
      .filter((l) => l !== 'Hardware acceleration methods:')
  }

  #logToInfo = (data: string) => {
    if (this.#logger) {
      this.#logger.info(data)
    }
  }

  #logToError = (data: string) => {
    if (this.#logger) {
      this.#logger.error(data)
    }
  }

  #logProcessToInfo = (name: string, data: string) => {
    if (['camera-', 'ffmpeg-', 'gstreamer-', 'mtx-'].some((prefix) => name.startsWith(prefix))) {
      if (this.#logger) {
        const logger = this.#logger.child({ mtx: name })
        logger.info(data)
      }
    }
  }

  #logProcessToWarn = (name: string, data: string) => {
    if (['camera-', 'ffmpeg-', 'gstreamer-', 'mtx-'].some((prefix) => name.startsWith(prefix))) {
      if (this.#logger) {
        const logger = this.#logger.child({ mtx: name })
        logger.warn(data)
      }
    }
  }

  #getMtxProcessName = (path: string) => {
    const slugifiedName = string.slug(path, {
      replacement: '-',
      lower: true,
      strict: true,
      locale: 'en',
      trim: true,
    })
    return `mtx-${slugifiedName}`
  }

  async #onDemand(payload: DemandEventPayload) {
    this.#logger?.info(`Received demand for "${payload.MTX_PATH}"`)
    let camera: Camera | null | undefined
    try {
      camera = await Camera.findBy({ mtx_path: payload.MTX_PATH })
      this.#app.bus.publish('camera', 'demand', camera ? camera.id : null, {
        name: camera ? camera.name : null,
        enabled: camera ? camera.isEnabled : null,
        path: payload.MTX_PATH,
        query: payload.MTX_QUERY,
      })
    } catch {}
    const processName = this.#getMtxProcessName(payload.MTX_PATH)
    const process = this.#app.pm3.get(processName)
    let doStart = false
    if (process) {
      if (process.exitCode === null && 'undefined' !== typeof process.pid) {
        // the process is alive and well
        this.#logger?.info(
          `"${payload.MTX_PATH}" already has a running process with PID "${process.pid}"`
        )
      } else {
        this.#logger?.info(`The process for "${payload.MTX_PATH}" is dead and will be restarted`)
        await this.#app.pm3.remove(processName)
        doStart = true
      }
    } else {
      this.#logger?.info(`"${payload.MTX_PATH}" does not yet have a process and will be started`)
      doStart = true
    }
    if (doStart) {
      this.#app.pm3.add(
        processName,
        {
          file: 'node',
          arguments: ['ace', 'nestmtx:stream', payload.MTX_PATH, this.#internalApiPort!.toString()],
          restart: true,
        },
        true
      )
    }
  }

  async #onUnDemand(payload: DemandEventPayload) {
    this.#logger?.info(`Received demand for "${payload.MTX_PATH}"`)
    let camera: Camera | null | undefined
    try {
      camera = await Camera.findBy({ mtx_path: payload.MTX_PATH })
      this.#app.bus.publish('camera', 'undemand', camera ? camera.id : null, {
        name: camera ? camera.name : null,
        enabled: camera ? camera.isEnabled : null,
        path: payload.MTX_PATH,
        query: payload.MTX_QUERY,
      })
    } catch {}
    if (camera && camera.isEnabled && camera.isPersistent) {
      this.#logger?.info(
        `Camera ${camera.name} (#${camera.id}) for path "${payload.MTX_PATH}" is persistent and will not be shut down`
      )
      return
    }
    const processName = this.#getMtxProcessName(payload.MTX_PATH)
    const process = this.#app.pm3.get(processName)
    if (process) {
      if (process.exitCode === null && 'undefined' !== typeof process.pid) {
        this.#logger?.info(
          `Shutting down process with PID "${process.pid}" for "${payload.MTX_PATH}"`
        )
        await this.#app.pm3.stop(processName)
      }
      this.#logger?.info(`Cleaning up process with PID "${process.pid}" for "${payload.MTX_PATH}"`)
      await this.#app.pm3.remove(processName)
    }
  }

  async #onReady(payload: ReadyEventPayload) {
    this.#logger?.info(`"${payload.MTX_PATH}" is streaming`)
    let camera: Camera | null | undefined
    try {
      camera = await Camera.findBy({ mtx_path: payload.MTX_PATH })
      this.#app.bus.publish('camera', 'ready', camera ? camera.id : null, {
        name: camera ? camera.name : null,
        enabled: camera ? camera.isEnabled : null,
        path: payload.MTX_PATH,
        query: payload.MTX_QUERY,
        sourceType: payload.MTX_SOURCE_TYPE,
        sourceId: payload.MTX_SOURCE_ID,
      })
    } catch {}
  }

  async #onNotReady(payload: ReadyEventPayload) {
    this.#logger?.info(`"${payload.MTX_PATH}" is no longer streaming`)
    let camera: Camera | null | undefined
    try {
      camera = await Camera.findBy({ mtx_path: payload.MTX_PATH })
      this.#app.bus.publish('camera', 'notReady', camera ? camera.id : null, {
        name: camera ? camera.name : null,
        enabled: camera ? camera.isEnabled : null,
        path: payload.MTX_PATH,
        query: payload.MTX_QUERY,
        sourceType: payload.MTX_SOURCE_TYPE,
        sourceId: payload.MTX_SOURCE_ID,
      })
    } catch {}
  }

  async #onRead(payload: ReadEventPayload) {
    let camera: Camera | null | undefined
    try {
      camera = await Camera.findBy({ mtx_path: payload.MTX_PATH })
      this.#app.bus.publish('camera', 'read', camera ? camera.id : null, {
        name: camera ? camera.name : null,
        enabled: camera ? camera.isEnabled : null,
        path: payload.MTX_PATH,
        query: payload.MTX_QUERY,
        readerType: payload.MTX_READER_TYPE,
        readerId: payload.MTX_READER_ID,
      })
    } catch {}
  }

  async #onUnread(payload: ReadEventPayload) {
    let camera: Camera | null | undefined
    try {
      camera = await Camera.findBy({ mtx_path: payload.MTX_PATH })
      this.#app.bus.publish('camera', 'unread', camera ? camera.id : null, {
        name: camera ? camera.name : null,
        enabled: camera ? camera.isEnabled : null,
        path: payload.MTX_PATH,
        query: payload.MTX_QUERY,
        readerType: payload.MTX_READER_TYPE,
        readerId: payload.MTX_READER_ID,
      })
    } catch {}
  }
}
