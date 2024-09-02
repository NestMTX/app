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
    logger.info(`Found ${liveCameras.length} live cameras`)
    if (liveCameras.length === 0) {
      return
    }
    for (const camera of liveCameras) {
      try {
        await camera.extend()
        logger.info(`Extended authentication for camera "${camera.name}" (${camera.id})`)
      } catch (error) {
        logger.error(
          `Failed to extend authentication for camera "${camera.name}" (${camera.id}) due to ${(error as Error).message}`
        )
      }
      // if (camera.expiresAt) {
      //   if (camera.expiresAt instanceof DateTime) {
      //     logger.info(
      //       `Camera "${camera.name}" (${camera.id}) expires at ${camera.expiresAt.toISO()}`
      //     )
      //   } else {
      //     logger.info(
      //       `Camera "${camera.name}" (${camera.id}) expires at ${inspect(camera.expiresAt, {
      //         depth: 20,
      //         colors: false,
      //       })}`
      //     )
      //   }
      // } else {
      //   logger.info(`Camera "${camera.name}" (${camera.id}) has no expiration date/time`)
      //   continue
      // }
      // if (!(camera.expiresAt instanceof DateTime)) {
      //   if ('string' === typeof camera.expiresAt) {
      //     camera.expiresAt = DateTime.fromISO(camera.expiresAt)
      //     logger.info(
      //       `Converted camera "${camera.name}" (${camera.id}) expiration to DateTime: ${camera.expiresAt.toISO()}`
      //     )
      //   }
      //   // @ts-ignore - this is a hack to get around the fact that the type of camera.expiresAt is not DateTime
      //   else if (camera.expiresAt instanceof Date) {
      //     camera.expiresAt = DateTime.fromJSDate(camera.expiresAt)
      //     logger.info(
      //       `Converted camera "${camera.name}" (${camera.id}) expiration to DateTime: ${camera.expiresAt.toISO()}`
      //     )
      //   } else {
      //     logger.error(
      //       `Got unexpected type for camera "${camera.name}" (${camera.id}) expiration: ${typeof camera.expiresAt} ${inspect(camera.expiresAt, { depth: 20, colors: false })}`
      //     )
      //   }
      // }
      // // if the expiration date/time is within the next 2 minutes, extend it
      // if (camera.expiresAt.diffNow().toMillis() <= 2 * 60 * 1000) {
      //   logger.info(
      //     `Camera "${camera.name}" (${camera.id}) expires ${camera.expiresAt.diffNow().rescale().toHuman()} and needs to be extended`
      //   )
      //   try {
      //     await camera.extend()
      //     logger.info(`Extended authentication for camera "${camera.name}" (${camera.id})`)
      //   } catch (error) {
      //     logger.error(
      //       `Failed to extend authentication for camera "${camera.name}" (${camera.id}) due to ${(error as Error).message}`
      //     )
      //   }
      // } else {
      //   logger.info(
      //     `Camera "${camera.name}" (${camera.id}) expires ${camera.expiresAt.diffNow().rescale().toHuman()} and does not need to be extended`
      //   )
      // }
    }
  }
}
