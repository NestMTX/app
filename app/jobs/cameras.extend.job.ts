import Camera from '#models/camera'
import { CronJob } from '#services/cron'
import { DateTime } from 'luxon'
import type { ApplicationService } from '@adonisjs/core/types'

export default class ExtendCameraStreamAuthenticationJob extends CronJob {
  #app: ApplicationService
  constructor(protected app: ApplicationService) {
    super(app)
    this.#app = app
  }
  get crontab() {
    return '* * * * *'
  }

  async run() {
    if (!this.#app || !this.#app.mediamtx) {
      return
    }
    const mainLogger = await this.#app.container.make('logger')
    const logger = mainLogger.child({ service: `job-ExtendCameraStreamAuthenticationJob` })
    const livePaths = this.#app.mediamtx.paths.map((path) => path.path)
    const liveCameras = await Camera.query()
      .whereIn('mtx_path', livePaths)
      .where('is_enabled', true)
    logger.info(`Found ${liveCameras.length} live cameras`)
    if (liveCameras.length === 0) {
      return
    }
    for (const camera of liveCameras) {
      if (camera.expiresAt) {
        logger.info(`Camera "${camera.name}" (${camera.id}) expires at ${camera.expiresAt.toISO()}`)
      } else {
        logger.info(`Camera "${camera.name}" (${camera.id}) has no expiration date/time`)
        continue
      }
      // if the expiration date/time is within the next 2 minutes, extend it
      const inFiveMinutes = DateTime.now().plus({ minutes: 2 })
      if (camera.expiresAt < inFiveMinutes) {
        logger.info(`Extending authentication for camera "${camera.name}" (${camera.id})`)
        await camera.extend()
      }
    }
  }
}
