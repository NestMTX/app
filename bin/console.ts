/*
|--------------------------------------------------------------------------
| Ace entry point
|--------------------------------------------------------------------------
|
| The "console.ts" file is the entrypoint for booting the AdonisJS
| command-line framework and executing commands.
|
| Commands do not boot the application, unless the currently running command
| has "options.startApp" flag set to true.
|
*/

process.env.TZ = 'UTC'
process.env.PORT = '2000'
process.env.HTTPS_PORT = '2001'
process.env.HOST = '0.0.0.0'
process.env.APP_KEY = process.env.APP_KEY || '2yHkmRqv832ze68zwyIOtBpwzSHIrVzV'
process.env.LOG_LEVEL = 'info'
process.env.NODE_ENV = process.env.NODE_ENV || 'development'
process.env.VERSION = process.env.VERSION || 'source'
process.env.BUILDPLATFORM = process.env.BUILDPLATFORM || 'local'
process.env.SHA = process.env.SHA || 'unknown'

import 'reflect-metadata'
import { Ignitor, prettyPrintError } from '@adonisjs/core'

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
  .ace()
  .handle(process.argv.splice(2))
  .catch((error) => {
    process.exitCode = 1
    prettyPrintError(error)
  })
