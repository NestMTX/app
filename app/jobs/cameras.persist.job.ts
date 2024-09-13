import Camera from '#models/camera'
import { CronJob } from '#services/cron'
import { execa } from 'execa'
import env from '#start/env'
import { resolve } from 'node:path'
import type { ApplicationService } from '@adonisjs/core/types'
import { logger as main } from '#services/logger'

export default class PersistCameraJob extends CronJob {
  #app: ApplicationService
  constructor(protected app: ApplicationService) {
    super(app)
    this.#app = app
  }
  get crontab() {
    return '* * * * *'
  }

  async run() {
    if (!this.#app) {
      return
    }
    const logger = main.child({ service: 'cron', job: 'cameras.persist' })
    const liveCameras = await Camera.query().where('is_enabled', true).where('is_persistent', true)
    logger.info(`Found ${liveCameras.length} cameras which should be persisted`)
    if (liveCameras.length === 0) {
      return
    }
    for (const camera of liveCameras) {
      try {
        await execa('node', ['ace', 'mediamtx:on:event', 'demand'], {
          cwd: resolve(this.#app.appRoot.pathname),
          env: {
            ...process.env,
            MTX_PATH: camera.mtxPath!,
            MTX_QUERY: '',
            RTSP_PORT: env.get('MEDIA_MTX_RTSP_TCP_PORT', '8554').toString(),
          },
        })
      } catch (error) {
        logger.error(
          `Error persisting camera ${camera.id} with path "${camera.mtxPath}": ${(error as Error).message}`
        )
      }
    }
  }
}
