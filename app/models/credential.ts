import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  computed,
  beforeSave,
  afterSave,
  afterFind,
  afterFetch,
} from '@adonisjs/lucid/orm'
import crypto from 'node:crypto'
import encryption from '@adonisjs/core/services/encryption'

const makeChecksum = (data: string) => {
  const hash = crypto.createHash('sha256')
  hash.update(data)
  return hash.digest('hex')
}

export default class Credential extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare description: string

  @column()
  declare checksum: string

  @column()
  declare oauthClientId: string

  @column({ serializeAs: null })
  declare oauthClientSecret: string

  @column()
  declare dacProjectId: string | null

  @column({ serializeAs: null })
  declare tokens: any | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @computed()
  get isAuthorized() {
    if ('string' !== typeof this.tokens) {
      return false
    }
    try {
      JSON.parse(this.tokens)
      return true
    } catch {
      return false
    }
  }

  @beforeSave()
  static async encrypt(item: Credential) {
    item.checksum = makeChecksum(item.oauthClientId)
    item.oauthClientId = encryption.encrypt(item.oauthClientId)
    item.oauthClientSecret = encryption.encrypt(item.oauthClientSecret)
    item.dacProjectId = item.dacProjectId ? encryption.encrypt(item.dacProjectId) : null
    item.tokens = item.tokens ? encryption.encrypt(JSON.stringify(item.tokens)) : null
  }

  @afterSave()
  static async decryptAfterSave(item: Credential) {
    await Credential.decrypt(item)
  }

  @afterFind()
  static async decrypt(item: Credential) {
    item.oauthClientId = encryption.decrypt(item.oauthClientId)!
    item.oauthClientSecret = encryption.decrypt(item.oauthClientSecret)!
    item.dacProjectId = item.dacProjectId ? encryption.decrypt(item.dacProjectId) : null
    item.tokens = item.tokens ? JSON.parse(encryption.decrypt(item.tokens)!) : null
  }

  @afterFetch()
  static async decryptAll(items: Credential[]) {
    for (const item of items) {
      await Credential.decrypt(item)
    }
  }

  async getOauthClient(redirectUrl: string) {
    const { google } = await import('googleapis')
    return new google.auth.OAuth2(this.oauthClientId, this.oauthClientSecret, redirectUrl)
  }

  async getSDMClient(redirectUrl: string) {
    if ('string' === typeof this.tokens) {
      try {
        this.tokens = JSON.parse(this.tokens)
      } catch {
        this.tokens = null
      }
    }
    if (!this.tokens || 'object' !== typeof this.tokens) {
      throw new Error('No tokens found')
    }
    const { google } = await import('googleapis')
    const oac = await this.getOauthClient(redirectUrl)
    oac.setCredentials(this.tokens)
    return google.smartdevicemanagement({
      version: 'v1',
      auth: oac,
    })
  }
}
