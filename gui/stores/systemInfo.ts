import { ref, computed } from 'vue'
import { checksum } from '@/utilities/checksum'

export interface PinoLog {
    [key: string]: any
    level: string
    time: string
    pid: number
    hostname: string
    msg: string
    service?: string
  }

const logStore = ref<Record<string, PinoLog>>({})

export const onIncomingLog = (log: PinoLog) => {
    const logChecksum = checksum(log)
    logStore.value[logChecksum] = log
    if (Object.values(logStore.value).length > 100) {
        const countToDelete = Object.values(logStore.value).length - 100
        // const oldestLogs = Object.values(logStore.value).sort
    }
}