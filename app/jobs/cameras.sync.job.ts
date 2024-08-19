import Credential from '#models/credential'
import Camera from '#models/camera'
import { CronJob } from '#services/cron'
import { DateTime } from 'luxon'

import type { smartdevicemanagement_v1 } from 'googleapis'

export default class SyncCloudCamerasJob extends CronJob {
  get crontab() {
    return '0 * * * *'
  }

  async run() {
    const authenticatedCredentials = await Credential.query().whereNotNull('tokens')
    for (const credential of authenticatedCredentials) {
      const sdm = await credential.getSDMClient()
      const cameras: Map<string, smartdevicemanagement_v1.Schema$GoogleHomeEnterpriseSdmV1Device> =
        new Map()
      try {
        const {
          data: { devices },
        } = await sdm.enterprises.devices.list({
          parent: ['enterprises', credential.dacProjectId].join('/'),
        })
        devices?.forEach((device) => {
          console.log(device)
        })
      } catch {
        // noop
      }
    }
  }
}
