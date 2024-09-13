import env from '#start/env'
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
import app from '@adonisjs/core/services/app'
import string from '@adonisjs/core/helpers/string'
import { logger as main } from '#services/logger'

dot.keepArray = true

import type { BelongsTo } from '@adonisjs/lucid/types/relations'

const makeChecksum = (data: string) => {
  const hash = crypto.createHash('sha256')
  hash.update(data)
  return hash.digest('hex')
}

export class IceCandidateError extends Error {
  readonly address: string
  readonly errorCode: number
  readonly errorText: string
  readonly port: number
  readonly url: string

  constructor(address: string, errorCode: number, errorText: string, port: number, url: string) {
    super(`ICE Candidate Error: ${errorText}`)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
    this.address = address
    this.errorCode = errorCode
    this.errorText = errorText
    this.port = port
    this.url = url
  }
}

import type { smartdevicemanagement_v1 } from 'googleapis'
// import { inspect } from 'node:util'

let DROPCAM_MAX_CASCADES = env.get('DROPCAM_MAX_CASCADES', 5)
if (DROPCAM_MAX_CASCADES <= 0) {
  DROPCAM_MAX_CASCADES = 5
}

type CameraModel =
  | 'Nest Cam (legacy)'
  | 'Nest Cam (outdoor or indoor, battery)'
  | 'Nest Cam with floodlight'
  | 'Nest Cam (indoor, wired)'
  | 'Nest Hub Max'
  | 'Nest Doorbell (legacy)'
  | 'Nest Doorbell (battery)'
  | 'Nest Doorbell (wired)'

interface GetBasePublicUrlOptions {
  protocol?: string
  pathname?: string
  searchParams?: Record<string, string>
}

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

  @column({ serializeAs: 'mtx_path' })
  declare mtxPath: string | null

  @column({ serializeAs: null })
  declare streamExtensionToken: string | null

  @column({ serializeAs: 'is_enabled', consume: Boolean, prepare: Boolean })
  declare isEnabled: boolean

  @column({ serializeAs: 'is_persistent', consume: Boolean, prepare: Boolean })
  declare isPersistent: boolean

  @column.dateTime({
    serializeAs: 'expires_at',
  })
  declare expiresAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeSave()
  static async encrypt(item: Camera) {
    if (!encryption) {
      return
    }
    item.checksum = makeChecksum(item.uid)
    item.uid = encryption.encrypt(item.uid)
    item.info = item.info ? encryption.encrypt(JSON.stringify(item.info)) : null
    item.isEnabled = Boolean(item.isEnabled)
    if (item.expiresAt instanceof DateTime) {
      // @ts-expect-error serializing to SQL
      item.expiresAt = item.expiresAt.toSQL()
    }
  }

  @afterSave()
  static async decryptAfterSave(item: Camera) {
    await Camera.decrypt(item)
  }

  @afterFind()
  static async decrypt(item: Camera) {
    if (!item) {
      return
    }
    if (!encryption) {
      return
    }
    item.uid = encryption.decrypt(item.uid)!
    item.info = item.info ? JSON.parse(encryption.decrypt(item.info)!) : null
    item.isEnabled = Boolean(item.isEnabled)
    if ('string' === typeof item.expiresAt) {
      item.expiresAt = DateTime.fromSQL(item.expiresAt)
    }
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

  // get #videoWidth() {
  //   return this.resolution ? Number.parseInt(this.resolution.split('x')[0]) : null
  // }

  // get #videoHeight() {
  //   return this.resolution ? Number.parseInt(this.resolution.split('x')[1]) : null
  // }

  get #videoCodecs() {
    return Array.isArray(this.#dottedTraits['sdm.devices.traits.CameraLiveStream.videoCodecs'])
      ? this.#dottedTraits['sdm.devices.traits.CameraLiveStream.videoCodecs']
      : []
  }

  @computed({ serializeAs: 'codecs_video' })
  get codecs_video() {
    return this.#videoCodecs.join(', ')
  }

  get #audioCodecs() {
    return Array.isArray(this.#dottedTraits['sdm.devices.traits.CameraLiveStream.audioCodecs'])
      ? this.#dottedTraits['sdm.devices.traits.CameraLiveStream.audioCodecs']
      : []
  }

  @computed({ serializeAs: 'codecs_audio' })
  get codecs_audio() {
    return this.#audioCodecs.join(', ')
  }

  get #streamProcessName() {
    // return `camera-${this.id}`
    if (!this.mtxPath) {
      return null
    }
    const slugifiedName = string.slug(this.mtxPath, {
      replacement: '-',
      lower: true,
      strict: true,
      locale: 'en',
      trim: true,
    })
    return `mtx-${slugifiedName}`
  }

  get #streamerProcess() {
    return app.pm3.processes.find((p) => p.name === this.#streamProcessName)
  }

  @computed({ serializeAs: 'status' })
  get status() {
    if (!this.mtxPath) {
      return 'unconfigured'
    } else if (!this.isEnabled) {
      return 'disabled'
    } else if (!this.#streamerProcess) {
      return 'dead'
    } else if (!this.#streamerProcess.pid) {
      return 'stopped'
    } else if (!this.#mediamtx_path) {
      return 'unavailable'
    } else if (!this.#mediamtx_path.ready) {
      return 'starting'
    } else {
      return 'running'
    }
  }

  @computed({ serializeAs: 'process_id' })
  get process_id() {
    return this.#streamerProcess ? this.#streamerProcess.pid : null
  }

  get #mediamtx_path() {
    return app.mediamtx.paths.find((p) => p.path === this.mtxPath)
  }

  @computed({ serializeAs: 'stream_ready' })
  get stream_ready() {
    return this.#mediamtx_path ? this.#mediamtx_path.ready : false
  }

  @computed({ serializeAs: 'stream_uptime' })
  get stream_uptime() {
    return this.#mediamtx_path && this.#mediamtx_path.ready ? this.#mediamtx_path.uptime : null
  }

  @computed({ serializeAs: 'stream_track_count' })
  get stream_track_count() {
    return this.#mediamtx_path && this.#mediamtx_path.ready ? this.#mediamtx_path.tracks : 0
  }

  @computed({ serializeAs: 'stream_consumer_count' })
  get stream_consumer_count() {
    return this.#mediamtx_path && this.#mediamtx_path.ready ? this.#mediamtx_path.consumers : 0
  }

  @computed({ serializeAs: 'stream_data_rx' })
  get stream_data_rx() {
    return this.#mediamtx_path && this.#mediamtx_path.ready ? this.#mediamtx_path.dataRx : 0
  }

  @computed({ serializeAs: 'stream_data_tx' })
  get stream_data_tx() {
    return this.#mediamtx_path && this.#mediamtx_path.ready ? this.#mediamtx_path.dataTx : 0
  }

  #getBasePublicUrl(port: number, options?: GetBasePublicUrlOptions) {
    const defaultOptions = {
      protocol: 'http',
      pathname: '',
      searchParams: {},
    }
    const defined = Object.assign({}, defaultOptions, options)
    const base = `http://localhost:${port.toString()}`
    const url = new URL(defined.pathname, base)
    url.protocol = `${defined.protocol}:`
    for (const key in defined.searchParams!) {
      url.searchParams.set(key, defined.searchParams![key])
    }
    return url
      .toString()
      .replace('http:', `${defined.protocol}:`)
      .replace(/\/\/(localhost|127\.0\.0\.1):/gm, '//<window.location.origin>:')
  }

  @computed({ serializeAs: 'url_rtsp_tcp' })
  get url_rtsp_tcp() {
    if (!this.mtxPath) {
      return null
    }
    const enabled = env.get('MEDIA_MTX_RTSP_ENABLED', false)
    if (!enabled) {
      return null
    }
    const port = env.get('NESTMTX_RTSP_TCP_PORT', env.get('MEDIA_MTX_RTSP_TCP_PORT', 8554))
    if (port <= 0) {
      return null
    }
    return this.#getBasePublicUrl(port, {
      protocol: 'rtsp',
      pathname: `/${this.mtxPath}`,
    })
  }
  @computed({ serializeAs: 'url_rtsp_udp_rtp' })
  get url_rtsp_udp_rtp() {
    if (!this.mtxPath) {
      return null
    }
    const enabled = env.get('MEDIA_MTX_RTSP_ENABLED', false)
    if (!enabled) {
      return null
    }
    const port = env.get('NESTMTX_RTSP_UDP_RTP_PORT', env.get('MEDIA_MTX_RTSP_UDP_RTP_PORT', 8000))
    if (port <= 0) {
      return null
    }
    return this.#getBasePublicUrl(port, {
      protocol: 'rtsp',
      pathname: `/${this.mtxPath}`,
    })
  }
  @computed({ serializeAs: 'url_rtsp_udp_rtcp' })
  get url_rtsp_udp_rtcp() {
    if (!this.mtxPath) {
      return null
    }
    const enabled = env.get('MEDIA_MTX_RTSP_ENABLED', false)
    if (!enabled) {
      return null
    }
    const port = env.get(
      'NESTMTX_RTSP_UDP_RTCP_PORT',
      env.get('MEDIA_MTX_RTSP_UDP_RTCP_PORT', 8001)
    )
    if (port <= 0) {
      return null
    }
    return this.#getBasePublicUrl(port, {
      protocol: 'rtsp',
      pathname: `/${this.mtxPath}`,
    })
  }
  @computed({ serializeAs: 'url_rtmp' })
  get url_rtmp() {
    if (!this.mtxPath) {
      return null
    }
    const enabled = env.get('MEDIA_MTX_RTMP_ENABLED', false)
    if (!enabled) {
      return null
    }
    const port = env.get('NESTMTX_RTMP_PORT', env.get('MEDIA_MTX_RTMP_PORT', 1935))
    if (port <= 0) {
      return null
    }
    return this.#getBasePublicUrl(port, {
      protocol: 'rtmp',
      pathname: `/${this.mtxPath}`,
    })
  }
  @computed({ serializeAs: 'url_hls' })
  get url_hls() {
    if (!this.mtxPath) {
      return null
    }
    const enabled = env.get('MEDIA_MTX_HLS_ENABLED', false)
    if (!enabled) {
      return null
    }
    const port = env.get('NESTMTX_HLS_PORT', env.get('MEDIA_MTX_HLS_PORT', 8888))
    if (port <= 0) {
      return null
    }
    return this.#getBasePublicUrl(port, {
      protocol: 'http',
      pathname: `/${this.mtxPath}`,
    })
  }
  @computed({ serializeAs: 'url_hls_m3u8' })
  get url_hls_m3u8() {
    if (!this.mtxPath) {
      return null
    }
    const enabled = env.get('MEDIA_MTX_HLS_ENABLED', false)
    if (!enabled) {
      return null
    }
    const port = env.get('NESTMTX_HLS_PORT', env.get('MEDIA_MTX_HLS_PORT', 8888))
    if (port <= 0) {
      return null
    }
    return this.#getBasePublicUrl(port, {
      protocol: 'http',
      pathname: `/${this.mtxPath}/index.m3u8`,
    })
  }
  @computed({ serializeAs: 'url_web_rtc' })
  get url_web_rtc() {
    if (!this.mtxPath) {
      return null
    }
    const enabled = env.get('MEDIA_MTX_WEB_RTC_ENABLED', false)
    if (!enabled) {
      return null
    }
    const port = env.get('NESTMTX_WEB_RTC_PORT', env.get('MEDIA_MTX_WEB_RTC_PORT', 8889))
    if (port <= 0) {
      return null
    }
    return this.#getBasePublicUrl(port, {
      protocol: 'http',
      pathname: `/${this.mtxPath}`,
    })
  }
  @computed({ serializeAs: 'url_srt' })
  get url_srt() {
    if (!this.mtxPath) {
      return null
    }
    const enabled = env.get('MEDIA_MTX_SRT_ENABLED', false)
    if (!enabled) {
      return null
    }
    const port = env.get('NESTMTX_SRT_PORT', env.get('MEDIA_MTX_SRT_PORT', 8890))
    if (port <= 0) {
      return null
    }
    return this.#getBasePublicUrl(port, {
      protocol: 'srt',
      searchParams: {
        streamid: `read:${this.mtxPath}`,
      },
    })
  }

  async enable() {
    if (!this.mtxPath) {
      throw new Error(`Camera ${this.id} does not have a path`)
    }
    this.isEnabled = true
    await this.save()
    await this.#killExistingProcesses()
  }

  async disable() {
    this.isEnabled = false
    this.isPersistent = false
    await this.save()
    await this.#killExistingProcesses()
  }

  async #killExistingProcesses() {
    if (!app.pm3 || !this.mtxPath) {
      return
    }
    const slugifiedName = string.slug(this.mtxPath, {
      replacement: '-',
      lower: true,
      strict: true,
      locale: 'en',
      trim: true,
    })
    try {
      await app.pm3.stop(`mtx-${slugifiedName}`)
    } catch {}
  }

  async extend() {
    const logger = main.child({ service: 'streamer', camera: this.id, method: 'extend' })
    try {
      await (this as Camera).load('credential')
    } catch {
      throw new Error(`Failed to load Google SDM API Credentials for Camera ${this.id}`)
    }
    if (
      !this.protocols ||
      (!this.protocols.includes('WEB_RTC') && !this.protocols.includes('RTSP'))
    ) {
      throw new Error(`Camera ${this.id} does not support any recognized protocols`)
    }
    if (this.#audioCodecs.length === 0) {
      throw new Error('This devices does not support any Audio codecs')
    }
    if (this.#videoCodecs.length === 0) {
      throw new Error('This device does not support any Video codecs')
    }
    if (!this.#audioCodecs.includes('AAC') && !this.#audioCodecs.includes('OPUS')) {
      throw new Error('Unsupported audio codec. Supported codecs are AAC and OPUS.')
    }
    if (!this.#videoCodecs.includes('H264')) {
      throw new Error('Unsupported video codec. Supported codec is H264.')
    }
    if (!this.streamExtensionToken) {
      throw new Error('No stream extension token found')
    }
    const service = await this.credential.getSDMClient()
    let command:
      | 'sdm.devices.commands.CameraLiveStream.ExtendRtspStream'
      | 'sdm.devices.commands.CameraLiveStream.ExtendWebRtcStream'

    let key: 'streamExtensionToken' | 'mediaSessionId'
    if (this.protocols.includes('WEB_RTC')) {
      command = 'sdm.devices.commands.CameraLiveStream.ExtendWebRtcStream'
      key = 'mediaSessionId'
    } else if (this.protocols.includes('RTSP')) {
      command = 'sdm.devices.commands.CameraLiveStream.ExtendRtspStream'
      key = 'streamExtensionToken'
    } else {
      throw new Error('No supported protocols found')
    }
    logger.info(`Requesting authentication extension from Google with command ${command}`)
    const {
      data: { results },
    } = await service.enterprises.devices.executeCommand({
      name: this.uid,
      requestBody: {
        command,
        params: {
          [key]: this.streamExtensionToken,
        },
      },
    })
    if (!results || !results[key]) {
      throw new Error('Failed to extend stream')
    }
    this.streamExtensionToken = results[key]
    this.expiresAt = DateTime.utc().plus({ minutes: 5 })
    if (results!.expiresAt) {
      const expiresAt = DateTime.fromISO(results!.expiresAt)
      if (expiresAt.isValid) {
        this.expiresAt = expiresAt
      }
    }
    await this.save()
  }

  async stop() {
    this.streamExtensionToken = null
    await this.save()
    return await this.#killExistingProcesses()
  }
}
