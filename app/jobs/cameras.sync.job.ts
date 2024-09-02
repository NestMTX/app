import Credential from '#models/credential'
import Camera from '#models/camera'
import { CronJob } from '#services/cron'
import dot from 'dot-object'
import crypto from 'node:crypto'

import type { smartdevicemanagement_v1 } from 'googleapis'
import type { ApplicationService } from '@adonisjs/core/types'

const makeChecksum = (data: string) => {
  const hash = crypto.createHash('sha256')
  hash.update(data)
  return hash.digest('hex')
}

export default class SyncCloudCamerasJob extends CronJob {
  #app: ApplicationService
  constructor(protected app: ApplicationService) {
    super(app)
    this.#app = app
  }

  get crontab() {
    return '0 * * * *'
  }

  async run() {
    const mainLogger = await this.#app.container.make('logger')
    const logger = mainLogger.child({ service: `job-SyncCloudCamerasJob` })
    logger.info('Fetching all authenticated credentials')
    const authenticatedCredentials = await Credential.query().whereNotNull('tokens')
    for (const credential of authenticatedCredentials) {
      logger.info(`Fetching devices for ${credential.description}`)
      const sdm = await credential.getSDMClient()
      const cameras: Map<string, smartdevicemanagement_v1.Schema$GoogleHomeEnterpriseSdmV1Device> =
        new Map()
      try {
        const {
          data: { devices },
        } = await sdm.enterprises.devices.list({
          parent: ['enterprises', credential.dacProjectId].join('/'),
        })
        if (!devices) {
          logger.warn(`${credential.description} did not return a devices list`)
          continue
        }
        logger.info(`Found ${devices.length} devices for ${credential.description}`)
        devices?.forEach((device) => {
          if (device && 'string' === typeof device.name) {
            const key = device.name
            const deviceTraits =
              'object' === typeof device.traits && null !== device.traits
                ? Object.keys(device.traits).map((t) => t.split('.').pop())
                : []
            const hasCameraTraits = deviceTraits.some((t) => t?.startsWith('Camera'))
            if (hasCameraTraits) {
              logger.info(`Found camera ${key} for ${credential.description}`)
              cameras.set(key, device)
            } else {
              logger.info(`Skipping non-camera device ${key} for ${credential.description}`)
            }
          }
        })
      } catch (error) {
        logger.error(
          `Failed to fetch devices for ${credential.description} due to ${(error as Error).message}`
        )
      }
      logger.info(`Found ${cameras.size} cameras for ${credential.description}`)
      const cams = [...cameras].map(([_key, value]) => value)
      for (const device of cams) {
        if ('string' === typeof device.name) {
          let camera = await Camera.query()
            .where('credential_id', credential.id)
            .where('checksum', makeChecksum(device.name))
            .first()
          if (!camera) {
            camera = new Camera()
            camera.credentialId = credential.id
            camera.uid = device.name
            camera.checksum = makeChecksum(device.name)
            camera.mtxPath = null
            camera.isEnabled = false
          }
          camera.room = this.#getDeviceRoomName(device)
          camera.name = this.#getDeviceName(device)
          camera.info = 'object' === typeof device && null !== device ? device : null
          try {
            await camera.save()
            logger.info(`Saved camera ${camera.name} (${camera.uid}) for ${credential.description}`)
          } catch (error) {
            logger.error(
              `Failed to save camera ${camera.name} (${camera.uid}) for ${credential.description} due to ${(error as Error).message}`
            )
          }
        }
      }
      const existing = await Camera.query().where('credential_id', credential.id)
      const toRemove = existing.filter((camera) => {
        !cameras.has(camera.uid)
      })
      for (const camera of toRemove) {
        await camera.delete()
      }
    }
  }

  #getDeviceRoomName(device: smartdevicemanagement_v1.Schema$GoogleHomeEnterpriseSdmV1Device) {
    let ret: string = 'Unknown'
    if (device.parentRelations) {
      for (const relation of device.parentRelations) {
        if ('string' === typeof relation.displayName) {
          ret = relation.displayName
          return ret.trim()
        }
      }
    }
    return ret.trim()
  }

  #getDeviceName(device: smartdevicemanagement_v1.Schema$GoogleHomeEnterpriseSdmV1Device) {
    const room = this.#getDeviceRoomName(device)
    let deviceType: string = 'Camera'
    switch (device.type) {
      case 'sdm.devices.types.DISPLAY':
        deviceType = 'Display'
        break

      case 'sdm.devices.types.DOORBELL':
        deviceType = 'Doorbell'
        break
    }
    const fallback = `${room} ${deviceType}`
    return this.#getDeviceTrait(device, 'sdm.devices.traits.Info.customName', fallback)
  }

  #getDeviceTrait(
    device: smartdevicemanagement_v1.Schema$GoogleHomeEnterpriseSdmV1Device,
    key: string,
    fallback: string = 'Unknown'
  ) {
    const dotified =
      'object' === typeof device.traits && null !== device.traits ? dot.dot(device.traits) : {}
    return dotified[key] || fallback
  }
}
