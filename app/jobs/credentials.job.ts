import Credential from '#models/credential'
import { CronJob } from '#services/cron'
import { DateTime } from 'luxon'

export default class CredentialsJob extends CronJob {
  get crontab() {
    return '* * * * *'
  }

  async run() {
    const authenticatedCredentials = await Credential.query().whereNotNull('tokens')
    for (const credential of authenticatedCredentials) {
      if (
        'object' === typeof credential.tokens &&
        null !== credential.tokens &&
        'number' === typeof credential.tokens.expiry_date
      ) {
        const expiryDate = DateTime.fromMillis(credential.tokens.expiry_date)
        const inFiveMinutes = DateTime.now().plus({ minutes: 5 })
        const now = DateTime.now()
        if (expiryDate < now) {
          console.log(credential.description, 'has expired')
        } else if (expiryDate < inFiveMinutes) {
          console.log(credential.description, 'is about to expire')
        }
      }
    }
  }
}
