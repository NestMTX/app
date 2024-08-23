import env from '#start/env'
import { execa } from 'execa'
import Camera from '#models/camera'
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

/**
 * A class for managing the MediaMTX service process
 */
export class GStreamerService {
  readonly #app: ApplicationService
  #logger?: Logger
  #ffmpegHwAccelerator?: string

  constructor(app: ApplicationService) {
    this.#app = app
  }

  async boot(logger: LoggerService, _nat: NATService, _ice: ICEService, pm3: PM3, ipc: IPCService) {
    this.#logger = logger.child({ service: 'gstreamer' })
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
    if (ffmpegHwAccelerator) {
      const availableHwAccelerators = await this.#getAvailableHwAccelerators()
      if (availableHwAccelerators.includes(ffmpegHwAccelerator)) {
        this.#ffmpegHwAccelerator = ffmpegHwAccelerator
        this.#logger.info(`FFmpeg HW Accelerator "${ffmpegHwAccelerator}" is available`)
      } else {
        this.#logger.error(
          `FFmpeg HW Accelerator "${ffmpegHwAccelerator}" is not available and will not be used`
        )
      }
    }
    this.#logger.info(`Loading Cameras which should be enabled`)
    const cameras = await Camera.query().whereNotNull('mtx_path').where('is_enabled', true)
    if (cameras.length === 0) {
      this.#logger.info(`No cameras found to start`)
      return
    }
    this.#logger.info(`Found ${cameras.length} cameras to start`)
    for (const camera of cameras) {
      await camera.start()
    }
    ipc.on('demand', this.#onDemand.bind(this))
    ipc.on('unDemand', this.#onUnDemand.bind(this))
  }

  async #onDemand(payload: DemandEventPayload) {
    const camera = await Camera.findBy({ mtx_path: payload.MTX_PATH })
    let processName: string
    if (!camera) {
      processName = `gstreamer-no-such-camera-${payload.MTX_PATH}`
      await this.#addNoSuchCameraStreamProcess(processName, payload.MTX_PATH)
    } else {
      processName = `gstreamer-camera-${camera.id}`
    }
    this.#app.pm3.on(`stdout:${processName}`, (data) => {
      this.#logger!.info(data)
    })
    this.#app.pm3.on(`stderr:${processName}`, (data) => {
      this.#logger!.error(data)
    })
    this.#app.pm3.on(`error:${processName}`, (data) => {
      this.#logger!.error(data)
    })
    try {
      this.#app.pm3.start(processName)
    } catch (error) {
      if (this.#logger) {
        this.#logger.error(error)
      }
    }
  }

  async #onUnDemand(payload: DemandEventPayload) {
    const camera = await Camera.findBy({ mtx_path: payload.MTX_PATH })
    let processName: string
    if (!camera) {
      processName = `gstreamer-no-such-camera-${payload.MTX_PATH}`
    } else {
      processName = `gstreamer-camera-${camera.id}`
    }
    try {
      await this.#app.pm3.remove(processName)
    } catch (error) {
      if (this.#logger) {
        this.#logger.error(error)
      }
    }
  }

  async #addNoSuchCameraStreamProcess(name: string, path: string) {
    const noSuchCameraImageFilePath = this.#app.makePath('resources/mediamtx/no-such-camera.jpg')
    const cmd = env.get('FFMPEG_BIN', 'ffmpeg')
    const args = [
      '-loglevel',
      'error',
      '-loop',
      '1',
      '-i',
      `${noSuchCameraImageFilePath}`,
      '-f',
      'lavfi',
      '-i',
      'anullsrc=r=48000:cl=stereo',
      '-c:v',
      'libx264',
      '-tune',
      'zerolatency',
      '-b:v',
      '500k',
      '-pix_fmt',
      'yuv420p',
      '-r',
      '1',
      '-c:a',
      'aac',
      '-b:a',
      '32k',
      '-f',
      'rtsp',
      '-rtsp_transport',
      'tcp',
      `rtsp://localhost:${env.get('MEDIA_MTX_RTSP_TCP_PORT', 8554)}/${path}`,
    ]
    try {
      await this.#app.pm3.add(name, {
        file: cmd,
        arguments: args,
      })
    } catch (error) {
      console.error('Error adding stream process:', error)
    }
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
}
