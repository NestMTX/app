/*
|--------------------------------------------------------------------------
| JavaScript entrypoint for running ace commands
|--------------------------------------------------------------------------
|
| DO NOT MODIFY THIS FILE AS IT WILL BE OVERRIDDEN DURING THE BUILD
| PROCESS.
|
| See docs.adonisjs.com/guides/typescript-build-process#creating-production-build
|
| Since, we cannot run TypeScript source code using "node" binary, we need
| a JavaScript entrypoint to run ace commands.
|
| This file registers the "ts-node/esm" hook with the Node.js module system
| and then imports the "bin/console.ts" file.
|
*/

process.env.TZ = 'UTC'
process.env.PORT = '2000'
process.env.HOST = '0.0.0.0'
process.env.APP_KEY = process.env.APP_KEY || '2yHkmRqv832ze68zwyIOtBpwzSHIrVzV'
process.env.LOG_LEVEL = 'info'
process.env.NODE_ENV = process.env.NODE_ENV || 'development'

/**
 * Register hook to process TypeScript files using ts-node
 */
import { register } from 'node:module'
register('ts-node/esm', import.meta.url)

/**
 * Import ace console entrypoint
 */
await import('./bin/console.js')
