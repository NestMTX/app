import env from '#start/env'
import { execa } from 'execa'
import Camera from '#models/camera'
import string from '@adonisjs/core/helpers/string'
import { Server as StreamPrivateApiServer } from 'socket.io'
import { logger as main } from '#services/logger'

import type { PM3 } from '#services/pm3'
import type { ApplicationService } from '@adonisjs/core/types'
import type { LoggerService } from '@adonisjs/core/types'
import type { NATService } from '#services/nat'
import type { ICEService } from '#services/ice'
import type { IPCService } from '#services/ipc'
import type winston from 'winston'
import {
  NULL_TOKEN_GRACE_MS,
  decideStallRecycle,
  decideUnhealthyWorkerRecycle,
} from '#utilities/stream_recycle_policy'

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
  readonly #logger: winston.Logger
  readonly #lastDataCounts: Map<string, number>
  readonly #stallCounts: Map<string, number>
  readonly #lastRecycleAt: Map<string, number>
  readonly #unhealthySince: Map<string, number>
  readonly #placeholderPaths: Set<string>
  readonly #recycleCooldownMs: number
  readonly #stallEscalateAfter: number
  readonly #nullTokenGraceMs: number

  #ffmpegHwAccelerator?: string
  #ffmpegHwAcceleratorDevice?: string

  #internalApiServer?: StreamPrivateApiServer

  constructor(app: ApplicationService) {
    this.#app = app
    this.#managedProcesses = new Set()
    this.#shuttingDownProcesses = new Set()
    this.#internalApiPort = env.get('INTERNAL_API_PORT', 62005)
    this.#logger = main.child({ service: 'streamer' })
    this.#lastDataCounts = new Map()
    this.#stallCounts = new Map()
    this.#lastRecycleAt = new Map()
    this.#unhealthySince = new Map()
    this.#placeholderPaths = new Set()
    // Avoid thrashing Google SDM / MediaMTX if a path is hard-down.
    this.#recycleCooldownMs = 60_000
    // Soft stall first; hard-recycle after consecutive no-progress observations.
    this.#stallEscalateAfter = 2
    // Generate*Stream is allowed this long before a null-token/placeholder worker is recycled.
    this.#nullTokenGraceMs = NULL_TOKEN_GRACE_MS
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

  async boot(
    _logger: LoggerService,
    _nat: NATService,
    _ice: ICEService,
    pm3: PM3,
    ipc: IPCService
  ) {
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
    ipc.on('test:stall', () => {
      if (this.#internalApiServer) {
        this.#internalApiServer.emit('test:stall')
        this.#logger.info(`Sent test:stall to all connected processes`)
      }
    })
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
      socket.on('placeholder', (path: unknown) => {
        if ('string' === typeof path && path.length > 0) {
          this.#placeholderPaths.add(path)
          this.#logger.info(`Path "${path}" is publishing placeholder video`)
        }
      })
      socket.on('live', (path: unknown) => {
        if ('string' === typeof path && path.length > 0) {
          this.#placeholderPaths.delete(path)
          this.#unhealthySince.delete(path)
          this.#logger.info(`Path "${path}" is publishing live camera video`)
        }
      })
    })
    this.#internalApiServer.listen(this.#internalApiPort)
    this.#logger.info(`Streamer Service API listening on port ${this.#internalApiPort}`)
  }

  async cronjob() {
    /**
     * Inspect every known MediaMTX path, not just ready ones.
     * A not-ready path with a live worker is how the side doorbell sat dead
     * for hours. A ready path with rising dataRx can still be connecting.jpg.
     */
    const paths = this.#app.mediamtx.getPaths()
    for (const path of paths) {
      const stall = decideStallRecycle({
        pathReady: path.ready,
        dataRx: path.dataRx,
        lastDataRx: this.#lastDataCounts.get(path.path),
        stallCount: this.#stallCounts.get(path.path) || 0,
        stallEscalateAfter: this.#stallEscalateAfter,
      })
      this.#stallCounts.set(path.path, stall.nextStallCount)
      if (stall.nextStallCount > 0) {
        this.#logger.warning(
          `Stream for path "${path.path}" is stalled, based on data transmission statistics (stall #${stall.nextStallCount})`
        )
        if (this.#internalApiServer) {
          this.#internalApiServer.emit(`${path.path}:stall`)
          this.#logger.info(`Sent ${path.path}:stall to processes for path "${path.path}"`)
        }
      }
      this.#lastDataCounts.set(path.path, path.dataRx)

      if (stall.recycle && stall.reason) {
        try {
          await this.recycleStream(path.path, stall.reason)
        } catch (error) {
          this.#logger.error(
            `Failed hard-recycle for stalled path "${path.path}": ${(error as Error).message}`
          )
        }
        continue
      }

      try {
        await this.recycleIfUnhealthy(path.path)
      } catch (error) {
        this.#logger.error(
          `Failed unhealthy-worker check for path "${path.path}": ${(error as Error).message}`
        )
      }
    }
  }

  /**
   * Recycle a live worker that is sitting on a null SDM token or connecting.jpg
   * after the startup grace window. Safe to call from extend, demand, and cron.
   */
  async recycleIfUnhealthy(path: string) {
    let camera: Camera | null = null
    try {
      camera = await Camera.findBy({ mtx_path: path })
    } catch {
      return false
    }
    if (!camera || !camera.isEnabled) {
      return false
    }

    const processName = this.#getMtxProcessName(path)
    const process = this.#app.pm3.get(processName)
    const workerAlive = Boolean(
      process && process.exitCode === null && 'number' === typeof process.pid
    )
    const hasStreamToken = Boolean(camera.streamExtensionToken)
    const publishingPlaceholder = this.#placeholderPaths.has(path)
    const now = Date.now()
    const unhealthy = (!hasStreamToken && workerAlive) || (publishingPlaceholder && workerAlive)
    if (unhealthy) {
      if (!this.#unhealthySince.has(path)) {
        this.#unhealthySince.set(path, now)
      }
    } else {
      this.#unhealthySince.delete(path)
    }

    const unhealthySince = this.#unhealthySince.get(path)
    const decision = decideUnhealthyWorkerRecycle({
      enabled: camera.isEnabled,
      hasStreamToken,
      workerAlive,
      publishingPlaceholder,
      unhealthySinceMs: 'number' === typeof unhealthySince ? now - unhealthySince : null,
      cooldownActive: now - (this.#lastRecycleAt.get(path) || 0) < this.#recycleCooldownMs,
      graceMs: this.#nullTokenGraceMs,
    })
    if (!decision.recycle) {
      return false
    }
    return this.recycleStream(path, decision.reason)
  }

  /**
   * Force a clean slate for a MediaMTX path:
   * 1) Invalidate the cached SDM stream extension token so Generate*Stream is used next
   * 2) Hard-kill any pm3 worker for the path (even if bookkeeping is inconsistent)
   * 3) Start a fresh nestmtx:stream worker
   */
  async recycleStream(path: string, reason: string = 'manual') {
    const processName = this.#getMtxProcessName(path)
    const now = Date.now()
    const last = this.#lastRecycleAt.get(path) || 0
    if (now - last < this.#recycleCooldownMs) {
      this.#logger.warning(
        `Skipping recycle for path "${path}" (${reason}); cooldown ${this.#recycleCooldownMs}ms active`
      )
      return false
    }
    this.#lastRecycleAt.set(path, now)
    this.#logger.warning(`Hard-recycling stream for path "${path}" (${reason})`)

    let camera: Camera | null = null
    try {
      camera = await Camera.findBy({ mtx_path: path })
    } catch {
      camera = null
    }

    if (camera) {
      const hadToken = Boolean(camera.streamExtensionToken)
      camera.streamExtensionToken = null
      camera.expiresAt = null
      try {
        await camera.save()
        if (hadToken) {
          this.#logger.info(
            `Cleared stale SDM stream token for camera "${camera.name}" (${camera.id}) path "${path}"`
          )
        }
        this.#app.bus.publish('camera', 'recycled', camera.id, {
          name: camera.name,
          path,
          reason,
        })
      } catch (error) {
        this.#logger.error(
          `Failed to clear stream token for camera "${camera.name}" (${camera.id}): ${(error as Error).message}`
        )
      }
    }

    await this.#app.pm3.hardRecycle(
      processName,
      {
        file: 'node',
        arguments: ['ace', 'nestmtx:stream', path, this.#internalApiPort!.toString()],
        restart: true,
      },
      true
    )
    this.#stallCounts.set(path, 0)
    this.#lastDataCounts.delete(path)
    this.#unhealthySince.delete(path)
    this.#placeholderPaths.delete(path)
    this.#logger.info(`Hard-recycled process "${processName}" for path "${path}"`)
    return true
  }

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

  #logFromSubProcess = (name: string, data: string) => {
    try {
      const decoded = JSON.parse(data)
      const logger = this.#logger.child({ service: 'streamer', mtx: name.replace('mtx-', '') })
      logger.log(decoded)
      return true
    } catch {
      return false
    }
  }

  #logProcessToInfo = (name: string, data: string) => {
    if (['camera-', 'ffmpeg-', 'gstreamer-', 'mtx-'].some((prefix) => name.startsWith(prefix))) {
      const output = this.#logFromSubProcess(name, data)
      if (!output) {
        const logger = this.#logger.child({ mtx: name })
        logger.info(data)
      }
    }
  }

  #logProcessToWarn = (name: string, data: string) => {
    if (['camera-', 'ffmpeg-', 'gstreamer-', 'mtx-'].some((prefix) => name.startsWith(prefix))) {
      const output = this.#logFromSubProcess(name, data)
      if (!output) {
        const logger = this.#logger.child({ mtx: name })
        logger.warning(data)
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
      // Treat only truly-running children as alive. A finished Execa handle with
      // exitCode set used to block restarts indefinitely ("zombie worker").
      const alive = process.exitCode === null && 'number' === typeof process.pid
      if (alive) {
        this.#logger?.info(
          `"${payload.MTX_PATH}" already has a running process with PID "${process.pid}"`
        )
        try {
          await this.recycleIfUnhealthy(payload.MTX_PATH)
        } catch (error) {
          this.#logger?.error(
            `Failed unhealthy-worker check on demand for "${payload.MTX_PATH}": ${(error as Error).message}`
          )
        }
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
