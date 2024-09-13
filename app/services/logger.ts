import { hostname } from 'node:os'
import winston from 'winston'
import Transport from 'winston-transport'
import env from '#start/env'
import { inspect as nodeInspect } from 'node:util'
import { EventEmitter } from 'node:events'
import { DateTime } from 'luxon'

const level = env.get('LOG_LEVEL', process.env.LOG_LEVEL || 'info')

export const loggerBus = new EventEmitter({
  captureRejections: true,
})

export const getPinoLogLevel = (winstonLevel: string) => {
  switch (winstonLevel) {
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

export const getNumericLogLevel = (winstonLevel: string) => {
  switch (winstonLevel) {
    case 'emerg':
      return 90
    case 'alert':
      return 80
    case 'crit':
      return 70
    case 'error':
      return 60
    case 'warning':
      return 50
    case 'notice':
      return 40
    case 'info':
      return 30
    case 'debug':
      return 20
    default:
      return 10
  }
}

export class LoggerBusTransport extends Transport {
  constructor(opts: Transport.TransportStreamOptions) {
    super({
      ...opts,
    })
  }
  log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info)
    })
    const now = DateTime.utc()
    loggerBus.emit('log', {
      level: getNumericLogLevel(info.level),
      msg: info.message,
      time: now.toMillis(),
      timestamp: now.toISO(),
      pid: process.pid,
      hostname: hostname(),
      service: info.service || 'core',
    })
    callback()
  }
}

export const logger = winston.createLogger({
  levels: winston.config.syslog.levels,
  level,
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      level,
    }),
    new LoggerBusTransport({
      level,
    }),
  ],
  exitOnError: false,
  handleExceptions: true,
  handleRejections: true,
})

export const subProcessLogger = winston.createLogger({
  levels: winston.config.syslog.levels,
  level,
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.json(),
      level,
    }),
  ],
  exitOnError: false,
  handleExceptions: true,
  handleRejections: true,
})

export const logCompletePromise = new Promise<void>((resolve) => {
  logger.on('finish', resolve)
})

export const pinoCompatibleLogger = {
  trace(what: any, ...args: any[]) {
    const toOutput = [what, ...args].map((a) => nodeInspect(a, { depth: 5 })).join(' ')
    logger.debug(toOutput)
  },
  debug(what: any, ...args: any[]) {
    const toOutput = [what, ...args].map((a) => nodeInspect(a, { depth: 5 })).join(' ')
    logger.debug(toOutput)
  },
  info(what: any, ...args: any[]) {
    const toOutput = [what, ...args].map((a) => nodeInspect(a, { depth: 5 })).join(' ')
    logger.info(toOutput)
  },
  warn(what: any, ...args: any[]) {
    const toOutput = [what, ...args].map((a) => nodeInspect(a, { depth: 5 })).join(' ')
    logger.warning(toOutput)
  },
  error(what: any, ...args: any[]) {
    const toOutput = [what, ...args].map((a) => nodeInspect(a, { depth: 5 })).join(' ')
    logger.error(toOutput)
  },
  fatal(what: any, ...args: any[]) {
    const toOutput = [what, ...args].map((a) => nodeInspect(a, { depth: 5 })).join(' ')
    logger.crit(toOutput)
  },
  child() {
    return pinoCompatibleLogger
  },
}

/**
 * Pretty prints an error with colorful output using
 * Youch terminal
 */
export async function prettyPrintError(error: any) {
  // @ts-expect-error
  const { default: youchTerminal } = await import('youch-terminal')
  const { default: Youch } = await import('youch')
  const youch = new Youch(error, {})
  logger.error(youchTerminal(await youch.toJSON(), { displayShortPath: true }))
}

export const inspect = (i: unknown) => logger.info(nodeInspect(i, { depth: 20, colors: true }))
