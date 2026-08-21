import Camera from '#models/camera'
import { CronJob } from '#services/cron'
import { logger as main } from '#services/logger'
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
    const logger = main.child({ service: 'cron', job: 'cameras.extend' })
    const livePaths = this.#app.mediamtx.paths.map((path) => path.path)
    const liveCameras = await Camera.query().whereIn('mtx_path', livePaths).where('is_enabled', true)
    const tokenCameras = liveCameras.filter((camera) => Boolean(camera.streamExtensionToken))
    const tokenlessCameras = liveCameras.filter((camera) => !camera.streamExtensionToken)
    logger.info(`Found ${tokenCameras.length} live cameras with stream extension tokens`)
    logger.info(`Found ${tokenlessCameras.length} live cameras with null stream tokens`)

    for (const camera of tokenlessCameras) {
      if (!camera.mtxPath) {
        logger.error(
          `Cannot recycle stream process for camera "${camera.name}" (${camera.id}): mtxPath is null`
        )
        continue
      }
      try {
        const recycled = await this.#app.streamer.recycleIfUnhealthy(camera.mtxPath)
        if (recycled) {
          logger.warning(
            `Hard-recycled camera "${camera.name}" (${camera.id}) because the stream token is still null`
          )
        }
      } catch (recycleError) {
        logger.error(
          `Failed to hard-recycle tokenless camera "${camera.name}": ${(recycleError as Error).message}`
        )
      }
    }

    for (const camera of tokenCameras) {
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
            // Soft pm3.restart is not enough: workers can look "alive" while publishing
            // frozen/connecting frames after an invalid streamExtensionToken. Clear the
            // token and hard-recycle the nestmtx:stream worker so Generate*Stream runs.
            if (!camera.mtxPath) {
              logger.error(
                `Cannot recycle stream process for camera "${camera.name}" (${camera.id}): mtxPath is null`
              )
            } else {
              try {
                await this.#app.streamer.recycleStream(
                  camera.mtxPath,
                  `sdm extend failed: ${(error as Error).message}`
                )
              } catch (recycleError) {
                logger.error(
                  `Failed to hard-recycle stream process for camera "${camera.name}": ${(recycleError as Error).message}`
                )
              }
            }
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
