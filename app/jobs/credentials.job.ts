import Credential from '#models/credential'
import { CronJob } from '#services/cron'
import { DateTime } from 'luxon'

import type { ApplicationService } from '@adonisjs/core/types'

export default class CredentialsJob extends CronJob {
  #app: ApplicationService
  constructor(protected app: ApplicationService) {
    super(app)
    this.#app = app
  }

  get crontab() {
    return '* * * * *'
  }

  async run() {
    const mainLogger = await this.#app.container.make('logger')
    const logger = mainLogger.child({ service: `job-CredentialsJob` })
    const authenticatedCredentials = await Credential.query().whereNotNull('tokens')
    for (const credential of authenticatedCredentials) {
      if (
        'object' === typeof credential.tokens &&
        null !== credential.tokens &&
        'number' === typeof credential.tokens.expiry_date
      ) {
        const expiryDate = DateTime.fromMillis(credential.tokens.expiry_date)
        let refresh = false
        if (expiryDate.diffNow().toMillis() < 0) {
          logger.info(
            `Credentials ${credential.description} expired ${expiryDate.diffNow().rescale().toHuman()}`
          )
          logger.info(`${credential.description} has expired`)
          refresh = true
        } else if (expiryDate.diffNow().toMillis() <= 2 * 60 * 1000) {
          logger.info(
            `Credentials ${credential.description} expires ${expiryDate.diffNow().rescale().toHuman()}`
          )
          logger.info(`${credential.description} is about to expire`)
          refresh = true
        } else {
          logger.info(
            `Credentials ${credential.description} expires ${expiryDate.diffNow().rescale().toHuman()}`
          )
        }
        if (refresh) {
          logger.info(`Refreshing ${credential.description}`)
          try {
            await credential.refresh()
          } catch (error) {
            logger.error(`Failed to refresh ${credential.description}: ${error.message}`)
            credential.tokens = null
            await credential.save()
          }
        }
      }
    }
  }
}
