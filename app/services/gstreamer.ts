import env from '#start/env'
import { execa } from 'execa'
import Camera from '#models/camera'
import type { PM3 } from '#services/pm3'
import type { ApplicationService } from '@adonisjs/core/types'
import type { LoggerService } from '@adonisjs/core/types'
import type { Logger } from '@adonisjs/logger'
import type { NATService } from '#services/nat'
import type { ICEService } from '#services/ice'

/**
 * A class for managing the MediaMTX service process
 */
export class GStreamerService {
  readonly #app: ApplicationService
  #logger?: Logger

  constructor(app: ApplicationService) {
    this.#app = app
  }

  async boot(logger: LoggerService, _nat: NATService, _ice: ICEService, pm3: PM3) {
    this.#logger = logger.child({ service: 'gstreamer' })
    const bin = env.get('GSTREAMER_PATH', 'gst-launch-1.0')
    this.#logger.info(`Checking for GStreamer Binary`)
    try {
      await execa(bin, ['--version'])
    } catch {
      throw new Error(`GStreamer binary not found`)
    }
    this.#logger.info(`GStreamer Binary Confirmed`)
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
  }
}
