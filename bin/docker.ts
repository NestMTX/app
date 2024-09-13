/*
|--------------------------------------------------------------------------
| HTTP server entrypoint
|--------------------------------------------------------------------------
|
| The "server.ts" file is the entrypoint for starting the AdonisJS HTTP
| server. Either you can run this file directly or use the "serve"
| command to run this file and monitor file changes
|
*/

process.env.TZ = 'UTC'
process.env.NODE_ENV = 'production'
process.env.PORT = '2000'
process.env.HTTPS_PORT = '2001'
process.env.HOST = '0.0.0.0'
process.env.APP_KEY = process.env.APP_KEY || '2yHkmRqv832ze68zwyIOtBpwzSHIrVzV'
process.env.LOG_LEVEL = 'info'
process.env.PINO_PORT = '62000'
process.env.MEDIA_MTX_PATH = '/home/node/mediamtx/mediamtx'
process.env.MEDIA_MTX_CONFIG_PATH = '/home/node/mediamtx/mediamtx.yml'
process.env.MEDIA_MTX_API_PORT = '9997'
process.env.MEDIA_MTX_RTSP_PLAYBACK_PORT = '9996'
process.env.MEDIA_MTX_RTSP_TCP_PORT = '8554'
process.env.MEDIA_MTX_RTSP_UDP_RTP_PORT = '8000'
process.env.MEDIA_MTX_RTSP_UDP_RTCP_PORT = '8001'
process.env.MEDIA_MTX_RTMP_PORT = '1935'
process.env.MEDIA_MTX_HLS_PORT = '8888'
process.env.MEDIA_MTX_WEB_RTC_PORT = '8889'
process.env.MEDIA_MTX_WEB_RTC_UDP_PORT = '8189'
process.env.MEDIA_MTX_SRT_PORT = '8890'
process.env.GSTREAMER_BIN = 'gst-launch-1.0'
process.env.FFMPEG_BIN = 'ffmpeg'
process.env.IP_RESOLVERS_ENABLED = process.env.IP_RESOLVERS_ENABLED || 'cloudflare,aws,httpBin'
process.env.VERSION = process.env.VERSION || 'source'
process.env.BUILDPLATFORM = process.env.BUILDPLATFORM || 'local'
process.env.SHA = process.env.SHA || 'unknown'

import 'reflect-metadata'
import { Ignitor } from '@adonisjs/core'
import { prettyPrintError } from '#services/logger'

/**
 * URL to the application root. AdonisJS need it to resolve
 * paths to file and directories for scaffolding commands
 */
const APP_ROOT = new URL('../', import.meta.url)

/**
 * The importer is used to import files in context of the
 * application.
 */
const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

new Ignitor(APP_ROOT, { importer: IMPORTER })
  .tap((app) => {
    app.booting(async () => {
      await import('#start/env')
    })
    app.listen('SIGTERM', () => app.terminate())
    app.listenIf(app.managedByPm2, 'SIGINT', () => app.terminate())
  })
  .httpServer()
  .start()
  .catch((error) => {
    process.exitCode = 1
    prettyPrintError(error)
  })
