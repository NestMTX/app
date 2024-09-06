import { CronJob } from '#services/cron'
import type { ApplicationService } from '@adonisjs/core/types'

export default class ConfirmStreamerProcessesJob extends CronJob {
  #app: ApplicationService
  constructor(protected app: ApplicationService) {
    super(app)
    this.#app = app
  }
  get crontab() {
    return '*/30 * * * * *'
  }

  async run() {
    if (!this.#app) {
      return
    }
    return await this.#app.gstreamer.cronjob()
  }
}
