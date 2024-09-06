import { ref, computed } from 'vue'
import { checksum } from '@/utilities/checksum'
import { DateTime } from 'luxon'

export interface PinoLog {
  [key: string]: any
  level: number
  time: number
  pid: number
  hostname: string
  msg: string
  service?: string
}

export interface LogLevelInfo {
  key: string
  color: string
  threshold: number
}

export interface SysLog extends PinoLog {
  datetime: DateTime
  service: string
  meta: LogLevelInfo
  checksum: string
}

const logStore = ref<Record<string, PinoLog>>({})

export const logLevels = computed<Array<LogLevelInfo>>(() => [
  { threshold: 20, key: 'logs.levels.trace', color: 'grey-lighten-2' },
  { threshold: 30, key: 'logs.levels.debug', color: 'gray' },
  { threshold: 40, key: 'logs.levels.info', color: 'light-blue' },
  { threshold: 50, key: 'logs.levels.warn', color: 'amber' },
  { threshold: 60, key: 'logs.levels.error', color: 'deep-orange' },
  { threshold: 70, key: 'logs.levels.fatal', color: 'red-darken-3' },
  { threshold: Number.POSITIVE_INFINITY, key: 'logs.levels.silent', color: 'grey-lighten-5' },
])

export const services = computed<Array<string>>(() => [
  'core',
  'http',
  'ice',
  'ipc',
  'mediamtx',
  'mqtt-broker',
  'mqtt',
  'nat',
  'socket.io',
])

const getLogLevelInfo = (level: number): LogLevelInfo => {
  let logLevelInfo: LogLevelInfo = {
    threshold: Number.POSITIVE_INFINITY,
    key: 'logs.levels.silent',
    color: 'grey-lighten-5',
  }
  for (let i = 0; i < logLevels.value.length; i++) {
    const l = logLevels.value[i]
    if (l.threshold < logLevelInfo.threshold && level < l.threshold) {
      logLevelInfo = l
    }
  }
  return logLevelInfo
}

export const logs = computed<Array<SysLog>>(() =>
  Object.values(logStore.value)
    .sort((a, b) => a.time - b.time)
    .map((log) => ({
      ...log,
      checksum: checksum(log),
      datetime: DateTime.fromMillis(log.time),
      service: log.service || 'core',
      meta: getLogLevelInfo(log.level),
    }))
)

export const onIncomingLog = (log: PinoLog) => {
  const logChecksum = checksum(log)
  logStore.value[logChecksum] = log
  if (Object.values(logStore.value).length > 100) {
    const countToDelete = Object.values(logStore.value).length - 100
    const oldestLogs = Object.keys(logStore.value)
      .map((key) => ({ key, time: logStore.value[key].time }))
      .sort((a, b) => a.time - b.time)
      .slice(0, countToDelete)
      .map((t) => t.key)
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    oldestLogs.forEach((key) => delete logStore.value[key])
  }
}
