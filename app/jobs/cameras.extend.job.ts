import Camera from '#models/camera'
import { CronJob } from '#services/cron'
// import { DateTime } from 'luxon'
// import { inspect } from 'node:util'
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
      .whereNotNull('stream_extension_token')
    logger.info(`Found ${liveCameras.length} live cameras with stream extension tokens`)
    if (liveCameras.length === 0) {
      return
    }
    for (const camera of liveCameras) {
      if (camera.expiresAt) {
        if (camera.expiresAt.diffNow().toMillis() <= 2 * 60 * 1000) {
          logger.info(
            `Camera "${camera.name}" (${camera.id}) expires ${camera.expiresAt.diffNow().rescale().toHuman()} and needs to be extended`
          )
          try {
            await camera.extend()
            logger.info(`Extended authentication for camera "${camera.name}" (${camera.id})`)
            this.#app.bus.publish('camera', 'extended', camera.id, {
              name: camera.name,
              expiresAt: camera.expiresAt.toISO(),
            })
          } catch (error) {
            logger.error(
              `Failed to extend authentication for camera "${camera.name}" (${camera.id}) due to ${(error as Error).message}`
            )
            this.#app.bus.publish('camera', 'failed-extension', camera.id, {
              name: camera.name,
              error,
            })
          }
        } else {
          logger.info(
            `Camera "${camera.name}" (${camera.id}) expires ${camera.expiresAt.diffNow().rescale().toHuman()} and does not need to be extended`
          )
        }
      } else {
        logger.info(`Camera "${camera.name}" (${camera.id}) has no expiration date/time`)
      }
    }
  }
}
