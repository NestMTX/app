import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  beforeSave,
  afterSave,
  afterFind,
  afterFetch,
  belongsTo,
  computed,
} from '@adonisjs/lucid/orm'
import crypto from 'node:crypto'
import encryption from '@adonisjs/core/services/encryption'
import Credential from '#models/credential'
import dot from 'dot-object'
dot.keepArray = true

import type { BelongsTo } from '@adonisjs/lucid/types/relations'

const makeChecksum = (data: string) => {
  const hash = crypto.createHash('sha256')
  hash.update(data)
  return hash.digest('hex')
}

import type { smartdevicemanagement_v1 } from 'googleapis'

type CameraModel =
  | 'Nest Cam (legacy)'
  | 'Nest Cam (outdoor or indoor, battery)'
  | 'Nest Cam with floodlight'
  | 'Nest Cam (indoor, wired)'
  | 'Nest Hub Max'
  | 'Nest Doorbell (legacy)'
  | 'Nest Doorbell (battery)'
  | 'Nest Doorbell (wired)'

export default class Camera extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare credentialId: number

  @column()
  declare uid: string

  @column()
  declare room: string

  @column()
  declare name: string

  @column()
  declare checksum: string

  @column()
  declare info: smartdevicemanagement_v1.Schema$GoogleHomeEnterpriseSdmV1Device | string | null

  @column()
  declare mtxPath: string | null

  @column()
  declare isEnabled: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeSave()
  static async encrypt(item: Camera) {
    item.checksum = makeChecksum(item.uid)
    item.uid = encryption.encrypt(item.uid)
    item.info = item.info ? encryption.encrypt(JSON.stringify(item.info)) : null
    item.isEnabled = Boolean(item.isEnabled)
  }

  @afterSave()
  static async decryptAfterSave(item: Camera) {
    await Camera.decrypt(item)
  }

  @afterFind()
  static async decrypt(item: Camera) {
    item.uid = encryption.decrypt(item.uid)!
    item.info = item.info ? JSON.parse(encryption.decrypt(item.info)!) : null
    item.isEnabled = Boolean(item.isEnabled)
  }

  @afterFetch()
  static async decryptAll(items: Camera[]) {
    for (const item of items) {
      await Camera.decrypt(item)
    }
  }

  @belongsTo(() => Credential)
  declare credential: BelongsTo<typeof Credential>

  get #dottedTraits() {
    return 'object' === typeof this.info &&
      null !== this.info &&
      'object' === typeof this.info.traits &&
      null !== this.info.traits
      ? dot.dot(this.info.traits)
      : {}
  }

  get #traitModels() {
    return {
      'sdm.devices.traits.Info': [
        'Nest Cam (legacy)',
        'Nest Cam (outdoor or indoor, battery)',
        'Nest Cam with floodlight',
        'Nest Cam (indoor, wired)',
        'Nest Hub Max',
        'Nest Doorbell (legacy)',
        'Nest Doorbell (battery)',
        'Nest Doorbell (wired)',
      ],
      'sdm.devices.traits.CameraClipPreview': ['Nest Doorbell (battery)', 'Nest Doorbell (wired)'],
      'sdm.devices.traits.CameraEventImage': [
        'Nest Cam (legacy)',
        'Nest Hub Max',
        'Nest Doorbell (legacy)',
      ],
      'sdm.devices.traits.CameraImage': [
        'Nest Cam (legacy)',
        'Nest Hub Max',
        'Nest Doorbell (legacy)',
      ],
      'sdm.devices.traits.CameraLiveStream': [
        'Nest Cam (legacy)',
        'Nest Cam (outdoor or indoor, battery)',
        'Nest Cam with floodlight',
        'Nest Cam (indoor, wired)',
        'Nest Hub Max',
        'Nest Doorbell (legacy)',
        'Nest Doorbell (battery)',
        'Nest Doorbell (wired)',
      ],
      'sdm.devices.traits.CameraMotion': [
        'Nest Cam (legacy)',
        'Nest Cam (outdoor or indoor, battery)',
        'Nest Cam with floodlight',
        'Nest Cam (indoor, wired)',
        'Nest Hub Max',
        'Nest Doorbell (legacy)',
        'Nest Doorbell (battery)',
        'Nest Doorbell (wired)',
      ],
      'sdm.devices.traits.CameraPerson': [
        'Nest Cam (legacy)',
        'Nest Cam (outdoor or indoor, battery)',
        'Nest Cam with floodlight',
        'Nest Cam (indoor, wired)',
        'Nest Hub Max',
        'Nest Doorbell (legacy)',
        'Nest Doorbell (battery)',
        'Nest Doorbell (wired)',
      ],
      'sdm.devices.traits.CameraSound': [
        'Nest Cam (legacy)',
        'Nest Hub Max',
        'Nest Doorbell (legacy)',
      ],
      'sdm.devices.traits.DoorbellChime': [
        'Nest Doorbell (legacy)',
        'Nest Doorbell (battery)',
        'Nest Doorbell (wired)',
      ],
    } as Record<string, CameraModel[]>
  }

  get #modelTraits() {
    return {
      'Nest Cam (legacy)': [
        'sdm.devices.traits.CameraEventImage',
        'sdm.devices.traits.CameraImage',
        'sdm.devices.traits.CameraLiveStream',
        'sdm.devices.traits.CameraMotion',
        'sdm.devices.traits.CameraPerson',
        'sdm.devices.traits.CameraSound',
        'sdm.devices.traits.Info',
      ],
      'Nest Cam (outdoor or indoor, battery)': [
        'sdm.devices.traits.CameraLiveStream',
        'sdm.devices.traits.CameraMotion',
        'sdm.devices.traits.CameraPerson',
        'sdm.devices.traits.Info',
      ],
      'Nest Cam with floodlight': [
        'sdm.devices.traits.CameraLiveStream',
        'sdm.devices.traits.CameraMotion',
        'sdm.devices.traits.CameraPerson',
        'sdm.devices.traits.Info',
      ],
      'Nest Cam (indoor, wired)': [
        'sdm.devices.traits.CameraLiveStream',
        'sdm.devices.traits.CameraMotion',
        'sdm.devices.traits.CameraPerson',
        'sdm.devices.traits.Info',
      ],
      'Nest Hub Max': [
        'sdm.devices.traits.CameraEventImage',
        'sdm.devices.traits.CameraImage',
        'sdm.devices.traits.CameraLiveStream',
        'sdm.devices.traits.CameraMotion',
        'sdm.devices.traits.CameraPerson',
        'sdm.devices.traits.CameraSound',
        'sdm.devices.traits.Info',
      ],
      'Nest Doorbell (legacy)': [
        'sdm.devices.traits.CameraEventImage',
        'sdm.devices.traits.CameraImage',
        'sdm.devices.traits.CameraLiveStream',
        'sdm.devices.traits.CameraMotion',
        'sdm.devices.traits.CameraPerson',
        'sdm.devices.traits.CameraSound',
        'sdm.devices.traits.DoorbellChime',
        'sdm.devices.traits.Info',
      ],
      'Nest Doorbell (battery)': [
        'sdm.devices.traits.CameraClipPreview',
        'sdm.devices.traits.CameraLiveStream',
        'sdm.devices.traits.CameraMotion',
        'sdm.devices.traits.CameraPerson',
        'sdm.devices.traits.DoorbellChime',
        'sdm.devices.traits.Info',
      ],
      'Nest Doorbell (wired)': [
        'sdm.devices.traits.CameraClipPreview',
        'sdm.devices.traits.CameraLiveStream',
        'sdm.devices.traits.CameraMotion',
        'sdm.devices.traits.CameraPerson',
        'sdm.devices.traits.DoorbellChime',
        'sdm.devices.traits.Info',
      ],
    } as Record<CameraModel, string[]>
  }

  get #deviceTypeModels() {
    return {
      'sdm.devices.types.CAMERA': [
        'Nest Cam (legacy)',
        'Nest Cam (outdoor or indoor, battery)',
        'Nest Cam with floodlight',
        'Nest Cam (indoor, wired)',
      ],
      'sdm.devices.types.DISPLAY': ['Nest Hub Max'],
      'sdm.devices.types.DOORBELL': [
        'Nest Doorbell (legacy)',
        'Nest Doorbell (battery)',
        'Nest Doorbell (wired)',
      ],
    } as Record<string, CameraModel[]>
  }

  get #protocolModels() {
    return {
      RTSP: ['Nest Cam (legacy)', 'Nest Hub Max', 'Nest Doorbell (legacy)'],
      WEB_RTC: [
        'Nest Cam (legacy)',
        'Nest Cam (outdoor or indoor, battery)',
        'Nest Cam with floodlight',
        'Nest Cam (indoor, wired)',
        'Nest Doorbell (battery)',
        'Nest Doorbell (wired)',
      ],
    } as Record<string, CameraModel[]>
  }

  @computed({ serializeAs: 'identified_as' })
  get identifiedAs() {
    const possible: Set<CameraModel> = new Set([
      'Nest Cam (legacy)',
      'Nest Cam (outdoor or indoor, battery)',
      'Nest Cam with floodlight',
      'Nest Cam (indoor, wired)',
      'Nest Hub Max',
      'Nest Doorbell (legacy)',
      'Nest Doorbell (battery)',
      'Nest Doorbell (wired)',
    ])
    if (!this.info || 'object' !== typeof this.info || null === this.info) {
      return null
    }
    if (
      'string' !== typeof this.info.type ||
      'object' !== typeof this.info.traits ||
      null === this.info.traits ||
      !Array.isArray(this.#dottedTraits['sdm.devices.traits.CameraLiveStream.supportedProtocols'])
    ) {
      return null
    }
    const deviceTypeModels = this.#deviceTypeModels[this.info.type]
    if (!Array.isArray(deviceTypeModels)) {
      return null
    }
    possible.forEach((m) => {
      if (!deviceTypeModels.includes(m)) {
        possible.delete(m)
      }
    })
    Object.keys(this.info.traits).forEach((trait) => {
      const deviceTraitModels = this.#traitModels[trait]
      possible.forEach((m) => {
        if (!Array.isArray(deviceTraitModels)) {
          console.log({ trait })
        }
        if (!Array.isArray(deviceTraitModels) || !deviceTraitModels.includes(m)) {
          possible.delete(m)
        }
      })
    })
    this.#dottedTraits['sdm.devices.traits.CameraLiveStream.supportedProtocols'].forEach(
      (protocol) => {
        const protocolModels = this.#protocolModels[protocol]
        possible.forEach((m) => {
          if (!Array.isArray(protocolModels) || !protocolModels.includes(m)) {
            possible.delete(m)
          }
        })
      }
    )
    if (possible.size > 0) {
      const deviceTraits = Object.keys(this.info.traits)
      possible.forEach((m) => {
        if (
          !this.info ||
          'object' !== typeof this.info ||
          null === this.info ||
          'object' !== typeof this.info.traits ||
          null === this.info.traits
        ) {
          possible.delete(m)
          return
        }
        const modelTraits = this.#modelTraits[m]
        if (!Array.isArray(modelTraits)) {
          console.log('no model traits', { m })
          return
        }
        const allExpectedModelTraitsExist = modelTraits.every((t) => deviceTraits.includes(t))
        const allDeviceTraitsAreaExpected = deviceTraits.every((t) => modelTraits.includes(t))
        if (!allExpectedModelTraitsExist || !allDeviceTraitsAreaExpected) {
          possible.delete(m)
        }
      })
    }
    if (possible.size === 0) {
      return null
    }
    return [...possible]
  }

  @computed({ serializeAs: 'protocols' })
  get protocols() {
    return Array.isArray(
      this.#dottedTraits['sdm.devices.traits.CameraLiveStream.supportedProtocols']
    )
      ? this.#dottedTraits['sdm.devices.traits.CameraLiveStream.supportedProtocols'].join(', ')
      : null
  }

  @computed({ serializeAs: 'resolution' })
  get resolution() {
    const maxVideoResolution =
      this.#dottedTraits['sdm.devices.traits.CameraLiveStream.maxVideoResolution.width'] &&
      this.#dottedTraits['sdm.devices.traits.CameraLiveStream.maxVideoResolution.height']
        ? {
            width:
              this.#dottedTraits['sdm.devices.traits.CameraLiveStream.maxVideoResolution.width'],
            height:
              this.#dottedTraits['sdm.devices.traits.CameraLiveStream.maxVideoResolution.height'],
          }
        : undefined
    let width: undefined | number
    let height: undefined | number
    if (maxVideoResolution) {
      width = maxVideoResolution.width
      height = maxVideoResolution.height
    }
    if (!width || !height) {
      if (this.protocols && this.protocols.includes('WEB_RTC')) {
        return `1920x1080`
      }
      return null
    }
    return `${width}x${height}`
  }

  @computed({ serializeAs: 'codecs_video' })
  get codecs_video() {
    return Array.isArray(this.#dottedTraits['sdm.devices.traits.CameraLiveStream.videoCodecs'])
      ? this.#dottedTraits['sdm.devices.traits.CameraLiveStream.videoCodecs'].join(', ')
      : null
  }

  @computed({ serializeAs: 'codecs_audio' })
  get codecs_audio() {
    return Array.isArray(this.#dottedTraits['sdm.devices.traits.CameraLiveStream.audioCodecs'])
      ? this.#dottedTraits['sdm.devices.traits.CameraLiveStream.audioCodecs'].join(', ')
      : null
  }
}
