import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, targets } from '@adonisjs/core/logger'

const getTranslatedLogLevel = (level: string) => {
  switch (level) {
    case 'emerg':
      return 'fatal'
    case 'alert':
      return 'fatal'
    case 'crit':
      return 'fatal'
    case 'error':
      return 'error'
    case 'warning':
      return 'warn'
    case 'notice':
      return 'info'
    case 'info':
      return 'info'
    case 'debug':
      return 'debug'
    default:
      return 'trace'
  }
}

const loggerConfig = defineConfig({
  default: 'app',

  /**
   * The loggers object can be used to define multiple loggers.
   * By default, we configure only one logger (named "app").
   */
  loggers: {
    app: {
      enabled: true,
      name: env.get('APP_NAME'),
      level: getTranslatedLogLevel(env.get('LOG_LEVEL', 'warning')),
      transport: {
        targets: targets()
          .pushIf(!app.inProduction, targets.pretty())
          .pushIf(app.inProduction, targets.file({ destination: 1 }))
          .toArray(),
      },
    },
  },
})

export default loggerConfig

/**
 * Inferring types for the list of loggers you have configured
 * in your application.
 */
declare module '@adonisjs/core/types' {
  export interface LoggersList extends InferLoggers<typeof loggerConfig> {}
}
