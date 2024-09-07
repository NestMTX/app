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
export class GStreamerService {
  readonly #demands: Set<string>
  readonly #app: ApplicationService
  readonly #managedProcesses: Set<string>
  readonly #shuttingDownProcesses: Set<string>
  readonly #demandTimeouts: Map<string, NodeJS.Timeout>
  readonly #undemandTimeouts: Map<string, NodeJS.Timeout>
  readonly #abortControllers: Map<string, AbortController>
  #logger?: Logger
  #ffmpegHwAccelerator?: string
  #ffmpegHwAcceleratorDevice?: string

  constructor(app: ApplicationService) {
    this.#app = app
    this.#managedProcesses = new Set()
    this.#shuttingDownProcesses = new Set()
    this.#undemandTimeouts = new Map()
    this.#demandTimeouts = new Map()
    this.#demands = new Set()
    this.#abortControllers = new Map()
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
    this.#logger.info(`GStreamer Service booted`)
    pm3.on('log:out', this.#logProcessToInfo)
    pm3.on('log:err', this.#logProcessToError)
  }

  async cronjob() {
    const livePaths = this.#app.mediamtx.paths.map((path) => path.path)
    const liveCameras = await Camera.query()
      .whereIn('mtx_path', livePaths)
      .where('is_enabled', true)
    if (liveCameras.length === 0) {
      return
    }
    // const liveCamerasMissingProcesses = liveCameras.filter(
    //   (camera) => 'undefined' === typeof this.#app.pm3.get(`camera-${camera.id}`)
    // )
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

  async #onDemand(payload: DemandEventPayload, force: boolean = false) {
    const undemandTimeout = this.#undemandTimeouts.get(payload.MTX_PATH)
    if (undemandTimeout) {
      clearTimeout(undemandTimeout)
      this.#undemandTimeouts.delete(payload.MTX_PATH)
    }
    if (this.#demands.has(payload.MTX_PATH) && !force) {
      return
    }
    let abortController = this.#abortControllers.get(payload.MTX_PATH)
    if (!abortController || abortController.signal.aborted) {
      abortController = new AbortController()
      this.#abortControllers.set(payload.MTX_PATH, abortController)
    }
    this.#demands.add(payload.MTX_PATH)
    this.#logger?.info(`Received demand for ${payload.MTX_PATH}`)
    const demandTimeout = this.#demandTimeouts.get(payload.MTX_PATH)
    if (demandTimeout) {
      clearTimeout(demandTimeout)
      this.#demandTimeouts.delete(payload.MTX_PATH)
    }
    let processName: string | undefined
    let camera: Camera | null | undefined
    try {
      camera = await Camera.findBy({ mtx_path: payload.MTX_PATH })
      if (!camera) {
        processName = `ffmpeg-no-such-camera-${payload.MTX_PATH}`
        await this.#addNoSuchCameraStreamProcess(
          processName,
          payload.MTX_PATH,
          abortController.signal
        )
      } else if (!camera.isEnabled) {
        processName = `ffmpeg-camera-disabled-${payload.MTX_PATH}`
        await this.#addCameraDisabledCameraStreamProcess(
          processName,
          payload.MTX_PATH,
          abortController.signal
        )
      } else {
        processName = `camera-${camera.id}`
        await camera.start(abortController.signal)
      }
      this.#app.bus.publish('camera', 'demand', camera ? camera.id : null, {
        name: camera ? camera.name : null,
        path: payload.MTX_PATH,
        query: payload.MTX_QUERY,
      })
      this.#app.pm3.start(processName)
      const process = this.#app.pm3.get(processName)
      if (process) {
        this.#logger?.info(`Started process ${processName} with PID ${process.pid}`)
        this.#app.bus.publish('camera', 'started', camera ? camera.id : null, {
          name: camera ? camera.name : null,
          path: payload.MTX_PATH,
          query: payload.MTX_QUERY,
          pid: process.pid,
        })
        process.on('exit', (code, signal) => {
          this.#logger?.info(
            `Process ${processName} has exited and is being removed from the process manager.`
          )
          this.#app.pm3.remove(processName!)
          this.#managedProcesses.delete(processName!)
          if (this.#demands.has(payload.MTX_PATH)) {
            this.#onDemand(payload, true)
            // if (!this.#demandTimeouts.has(payload.MTX_PATH)) {
            //   this.#onDemand(payload, true)
            // }
          }
          if (camera) {
            camera.streamExtensionToken = null
            camera.expiresAt = null
            camera.save()
          }
          this.#app.bus.publish('camera', 'stopped', camera ? camera.id : null, {
            name: camera ? camera.name : null,
            path: payload.MTX_PATH,
            query: payload.MTX_QUERY,
            pid: process.pid,
            exitCode: code,
            exitSignal: signal,
          })
        })
        this.#managedProcesses.add(processName)
      } else {
        this.#onDemand(payload, true)
      }
    } catch (error) {
      if (this.#logger) {
        this.#logger.error(error)
      }
      if (this.#demands.has(payload.MTX_PATH)) {
        this.#onDemand(payload, true)
        // if (!this.#demandTimeouts.has(payload.MTX_PATH)) {
        //   this.#demandTimeouts.set(
        //     payload.MTX_PATH,
        //     setTimeout(() => this.#onDemand(payload, true), 30000)
        //   )
        // }
      }
      if (processName) {
        this.#app.pm3.remove(processName)
        this.#managedProcesses.delete(processName)
      }
      this.#app.bus.publish('camera', 'errored', camera ? camera.id : null, {
        name: camera ? camera.name : null,
        path: payload.MTX_PATH,
        query: payload.MTX_QUERY,
        pid: process.pid,
        error,
      })
    }
  }

  async #onUnDemandTimeout(payload: DemandEventPayload) {
    this.#logger?.info(`Undemand Delay for ${payload.MTX_PATH} has been reached`)
    this.#demands.delete(payload.MTX_PATH)
    const abortController = this.#abortControllers.get(payload.MTX_PATH)
    if (abortController) {
      abortController.abort()
      this.#abortControllers.delete(payload.MTX_PATH)
    }
    let camera: Camera | null | undefined
    try {
      camera = await Camera.findBy({ mtx_path: payload.MTX_PATH })
      this.#app.bus.publish('camera', 'unDemand', camera ? camera.id : null, {
        name: camera ? camera.name : null,
        path: payload.MTX_PATH,
        query: payload.MTX_QUERY,
      })
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
      clearTimeout(undemandTimeout)
    }
    this.#undemandTimeouts.set(
      payload.MTX_PATH,
      setTimeout(() => this.#onUnDemandTimeout(payload), 60000)
    )
  }

  async #onReady(payload: ReadyEventPayload) {
    let camera: Camera | null | undefined
    try {
      camera = await Camera.findBy({ mtx_path: payload.MTX_PATH })
      this.#app.bus.publish('camera', 'ready', camera ? camera.id : null, {
        name: camera ? camera.name : null,
        path: payload.MTX_PATH,
        query: payload.MTX_QUERY,
        sourceType: payload.MTX_SOURCE_TYPE,
        sourceId: payload.MTX_SOURCE_ID,
      })
    } catch {}
  }

  async #onNotReady(payload: ReadyEventPayload) {
    let camera: Camera | null | undefined
    try {
      camera = await Camera.findBy({ mtx_path: payload.MTX_PATH })
      this.#app.bus.publish('camera', 'notReady', camera ? camera.id : null, {
        name: camera ? camera.name : null,
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
        path: payload.MTX_PATH,
        query: payload.MTX_QUERY,
        readerType: payload.MTX_READER_TYPE,
        readerId: payload.MTX_READER_ID,
      })
    } catch {}
  }

  async #addNoSuchCameraStreamProcess(name: string, path: string, signal?: AbortSignal) {
    // const filepath = this.#app.makePath('resources/mediamtx/no-such-camera.jpg')
    // return await this.#addFFmpegStreamFromJpegProcess(name, path, filepath)
    const filepath = this.#app.makePath('resources/mediamtx/no-such-camera.mp4')
    return await this.#addFFmpegStreamFromMp4Process(name, path, filepath, signal)
  }

  async #addCameraDisabledCameraStreamProcess(name: string, path: string, signal?: AbortSignal) {
    // const filepath = this.#app.makePath('resources/mediamtx/camera-disabled.jpg')
    // return await this.#addFFmpegStreamFromJpegProcess(name, path, filepath)
    const filepath = this.#app.makePath('resources/mediamtx/camera-disabled.mp4')
    return await this.#addFFmpegStreamFromMp4Process(name, path, filepath, signal)
  }

  // async #addCameraConnectingCameraStreamProcess(name: string, path: string, signal?: AbortSignal) {
  //   const filepath = this.#app.makePath('resources/mediamtx/connecting.jpg')
  //   return await this.#addFFmpegStreamFromJpegProcess(name, path, filepath)
  // }

  // async #addFFmpegStreamFromJpegProcess(name: string, path: string, filepath: string) {
  //   const cmd = env.get('FFMPEG_BIN', 'ffmpeg')
  //   const args = [
  //     '-loglevel',
  //     'warning',
  //     '-loop',
  //     '1',
  //     '-i',
  //     `${filepath}`,
  //     '-f',
  //     'lavfi',
  //     '-i',
  //     'anullsrc=r=48000:cl=stereo',
  //     '-c:v',
  //     'libx264',
  //     '-tune',
  //     'zerolatency',
  //     '-b:v',
  //     '500k',
  //     '-pix_fmt',
  //     'yuv420p',
  //     '-r',
  //     '1',
  //     '-c:a',
  //     'aac',
  //     '-b:a',
  //     '32k',
  //     '-f',
  //     'rtsp',
  //     '-rtsp_transport',
  //     'tcp',
  //     `rtsp://127.0.0.1:${env.get('MEDIA_MTX_RTSP_TCP_PORT', 8554)}/${path}`,
  //   ]
  //   try {
  //     await this.#app.pm3.add(name, {
  //       file: cmd,
  //       arguments: args,
  //     })
  //   } catch (error) {
  //     console.error('Error adding stream process:', error)
  //   }
  // }

  async #addFFmpegStreamFromMp4Process(
    name: string,
    path: string,
    filepath: string,
    signal?: AbortSignal
  ) {
    const cmd = env.get('FFMPEG_BIN', 'ffmpeg')
    const args = [
      '-loglevel',
      'warning',
      '-stream_loop',
      '-1', // Loop the input file indefinitely
      '-i',
      `${filepath}`, // Input file
      '-r',
      '10', // Set maximum frame rate to 10fps
      '-c:v',
      'libx264', // Ensure H264 codec for video
      '-g',
      '10', // Set keyframe interval to 10
      '-bf',
      '0', // Disable B-frames
      '-c:a',
      'aac', // Ensure AAC codec for audio
      '-bufsize',
      '512k', // Keep buffer size small
      '-threads',
      '1', // Limit the number of threads to manage CPU load
      '-fps_mode',
      'cfr', // Ensure constant frame rate (CFR)
      '-f',
      'rtsp', // Output format: RTSP
      '-rtsp_transport',
      'udp', // Use UDP for RTSP transport
      `rtsp://127.0.0.1:${env.get('MEDIA_MTX_RTSP_TCP_PORT', 8554)}/${path}`, // RTSP output URL
    ]

    console.log(cmd, ...args)

    try {
      await this.#app.pm3.add(name, {
        file: cmd,
        arguments: args,
        signal,
      })
    } catch (error) {
      console.error('Error adding stream process:', error)
    }
  }
}
