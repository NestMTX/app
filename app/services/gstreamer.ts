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
  readonly #demands: Set<string>
  readonly #app: ApplicationService
  readonly #managedProcesses: Set<string>
  readonly #shuttingDownProcesses: Set<string>
  readonly #undemandTimeouts: Map<string, NodeJS.Timeout>
  #logger?: Logger
  #ffmpegHwAccelerator?: string
  #ffmpegHwAcceleratorDevice?: string

  constructor(app: ApplicationService) {
    this.#app = app
    this.#managedProcesses = new Set()
    this.#shuttingDownProcesses = new Set()
    this.#undemandTimeouts = new Map()
    this.#demands = new Set()
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
    this.#logger.info(`GStreamer Service booted`)
    pm3.on('log:out', this.#logProcessToInfo)
    pm3.on('log:err', this.#logProcessToError)
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

  // #logToInfo = (data: string) => {
  //   if (this.#logger) {
  //     this.#logger.info(data)
  //   }
  // }

  // #logToError = (data: string) => {
  //   if (this.#logger) {
  //     this.#logger.error(data)
  //   }
  // }

  #logProcessToInfo = (name: string, data: string) => {
    if (['camera-', 'ffmpeg-', 'gstreamer-'].some((prefix) => name.startsWith(prefix))) {
      if (this.#logger) {
        const logger = this.#logger.child({ camera: name })
        logger.info(data)
      }
    }
    // this.#logToInfo(`[${name}] ${data}`)
  }

  #logProcessToError = (name: string, data: string) => {
    if (['camera-', 'ffmpeg-', 'gstreamer-'].some((prefix) => name.startsWith(prefix))) {
      if (this.#logger) {
        const logger = this.#logger.child({ camera: name })
        logger.warn(data)
      }
    }
    // this.#logToError(`[${name}] ${data}`)
  }

  async #onDemand(payload: DemandEventPayload) {
    const undemandTimeout = this.#undemandTimeouts.get(payload.MTX_PATH)
    if (undemandTimeout) {
      clearTimeout(undemandTimeout)
      this.#undemandTimeouts.delete(payload.MTX_PATH)
    }
    if (this.#demands.has(payload.MTX_PATH)) {
      return
    }
    this.#demands.add(payload.MTX_PATH)
    this.#logger?.info(`Received demand for ${payload.MTX_PATH}`)
    let processName: string | undefined
    try {
      const camera = await Camera.findBy({ mtx_path: payload.MTX_PATH })
      if (!camera) {
        processName = `ffmpeg-no-such-camera-${payload.MTX_PATH}`
        await this.#addNoSuchCameraStreamProcess(processName, payload.MTX_PATH)
      } else if (!camera.isEnabled) {
        processName = `ffmpeg-camera-disabled-${payload.MTX_PATH}`
        await this.#addCameraDisabledCameraStreamProcess(processName, payload.MTX_PATH)
      } else {
        processName = `camera-${camera.id}`
        // const connectingProcessName = `camera-connecting-${camera.id}`
        // await this.#addCameraConnectingCameraStreamProcess(connectingProcessName, payload.MTX_PATH)
        // this.#app.pm3.on(`stdout:${connectingProcessName}`, this.#logToInfo.bind(this))
        // this.#app.pm3.on(`stderr:${connectingProcessName}`, this.#logToError.bind(this))
        // this.#app.pm3.on(`error:${connectingProcessName}`, this.#logToError.bind(this))
        // this.#app.pm3.start(connectingProcessName)
        await camera.start()
        // await this.#app.pm3.stop(connectingProcessName)
        // await this.#app.pm3.remove(connectingProcessName)
        // this.#app.pm3.off(`stdout:${connectingProcessName}`, this.#logToInfo.bind(this))
        // this.#app.pm3.off(`stderr:${connectingProcessName}`, this.#logToError.bind(this))
        // this.#app.pm3.off(`error:${connectingProcessName}`, this.#logToError.bind(this))
      }
      // this.#app.pm3.on(`stdout:${processName}`, this.#logToInfo.bind(this))
      // this.#app.pm3.on(`stderr:${processName}`, this.#logToError.bind(this))
      // this.#app.pm3.on(`error:${processName}`, this.#logToError.bind(this))
      this.#app.pm3.start(processName)
      const process = this.#app.pm3.get(processName)
      if (process) {
        this.#logger?.info(`Started process ${processName} with PID ${process.pid}`)
        process.on('exit', () => {
          this.#logger?.info(
            `Process ${processName} has exited and is being removed from the process manager.`
          )
          this.#app.pm3.remove(processName)
          this.#managedProcesses.delete(processName)
          if (this.#demands.has(payload.MTX_PATH)) {
            this.#onDemand(payload)
          }
        })
      }
      this.#managedProcesses.add(processName)
    } catch (error) {
      if (this.#logger) {
        this.#logger.error(error)
      }
      if (this.#demands.has(payload.MTX_PATH)) {
        this.#onDemand(payload)
      }
      if (processName) {
        this.#app.pm3.remove(processName)
        this.#managedProcesses.delete(processName)
      }
    }
  }

  async #onUnDemandTimeout(payload: DemandEventPayload) {
    this.#logger?.info(`Undemand Delay for ${payload.MTX_PATH} has been reached`)
    this.#demands.delete(payload.MTX_PATH)
    try {
      const camera = await Camera.findBy({ mtx_path: payload.MTX_PATH })
      let processName: string
      if (!camera) {
        processName = `ffmpeg-no-such-camera-${payload.MTX_PATH}`
      } else if (!camera.isEnabled) {
        processName = `ffmpeg-camera-disabled-${payload.MTX_PATH}`
      } else {
        processName = `camera-${camera.id}`
      }
      this.#shuttingDownProcesses.add(processName)
      await this.#app.pm3.remove(processName)
      // this.#app.pm3.off(`stdout:${processName}`, this.#logToInfo.bind(this))
      // this.#app.pm3.off(`stderr:${processName}`, this.#logToError.bind(this))
      // this.#app.pm3.off(`error:${processName}`, this.#logToError.bind(this))
      this.#managedProcesses.delete(processName)
      this.#shuttingDownProcesses.delete(processName)
    } catch (error) {
      if (this.#logger) {
        this.#logger.error(error)
      }
    }
  }

  async #onUnDemand(payload: DemandEventPayload) {
    this.#logger?.info(
      `Received unDemand for ${payload.MTX_PATH}. Delaying for 60 second to see if there is a new demand.`
    )
    const undemandTimeout = this.#undemandTimeouts.get(payload.MTX_PATH)
    if (undemandTimeout) {
      return
    }
    this.#undemandTimeouts.set(
      payload.MTX_PATH,
      setTimeout(() => this.#onUnDemandTimeout(payload), 60000)
    )
  }

  async #addNoSuchCameraStreamProcess(name: string, path: string) {
    const filepath = this.#app.makePath('resources/mediamtx/no-such-camera.jpg')
    return await this.#addFFmpegStreamFromJpegProcess(name, path, filepath)
  }

  async #addCameraDisabledCameraStreamProcess(name: string, path: string) {
    const filepath = this.#app.makePath('resources/mediamtx/camera-disabled.jpg')
    return await this.#addFFmpegStreamFromJpegProcess(name, path, filepath)
  }

  // async #addCameraConnectingCameraStreamProcess(name: string, path: string) {
  //   const filepath = this.#app.makePath('resources/mediamtx/connecting.jpg')
  //   return await this.#addFFmpegStreamFromJpegProcess(name, path, filepath)
  // }

  async #addFFmpegStreamFromJpegProcess(name: string, path: string, filepath: string) {
    const cmd = env.get('FFMPEG_BIN', 'ffmpeg')
    const args = [
      '-loglevel',
      'warning',
      '-loop',
      '1',
      '-i',
      `${filepath}`,
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
      `rtsp://127.0.0.1:${env.get('MEDIA_MTX_RTSP_TCP_PORT', 8554)}/${path}`,
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
}
