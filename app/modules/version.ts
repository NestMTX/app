import type { ApplicationService } from '@adonisjs/core/types'
import { ApiServiceModule } from '#services/api'
import env from '#start/env'
import mediaMtxApiDefinition from '../../lib/mediamtx/definition.js'
import { execa } from 'execa'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'

export default class VersionModule implements ApiServiceModule {
  #app: ApplicationService
  constructor(app: ApplicationService) {
    this.#app = app
  }

  get description() {
    return 'Application Version Information'
  }

  get insecure() {
    return true
  }

  get schemas() {
    return {}
  }

  async list() {
    const ret: Record<string, string> = {
      release: env.get('VERSION', 'source'),
      commit: env.get('SHA', 'unknown'),
      platform: env.get('BUILDPLATFORM', 'local'),
      mediamtx: mediaMtxApiDefinition.info.version,
      database: env.get('DB_CONNECTION', 'sqlite'),
    }
    const [gstreamerVersion, ffmpegVersion] = await Promise.all([
      execa('gst-launch-1.0', ['--version']).then((result) => result.stdout),
      execa('ffmpeg', ['-version']).then((result) => result.stdout),
    ])
    ret.gstreamer = gstreamerVersion
    ret.ffmpeg = ffmpegVersion
    const versionFilePath = resolve(this.#app.appRoot.pathname, 'version.txt')
    if (existsSync(versionFilePath)) {
      const raw = await readFile(versionFilePath, 'utf-8')
      const versionDataRaw: Record<string, string> = {}
      raw.split('\n').forEach((line) => {
        const [key, value] = line.split('=')
        versionDataRaw[key] = value
      })
      if (versionDataRaw.VERSION) {
        ret.version = versionDataRaw.VERSION
      }
      if (versionDataRaw.BUILDPLATFORM) {
        ret.platform = versionDataRaw.BUILDPLATFORM
      }
      if (versionDataRaw.SHA) {
        ret.commit = versionDataRaw.SHA
      }
    }
    return ret
  }

  get $descriptionOfList() {
    return 'Get the current Application Version Information'
  }
}
