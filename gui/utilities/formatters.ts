import numeral from 'numeral'
import { filesize } from 'filesize'
import { DateTime } from 'luxon'

export const formatInteger = (value: unknown): string => {
  return numeral(value).format('0,0')
}

export const formatFileSize = (value: unknown): string => {
  if ('number' !== typeof value) {
    value = Number(value)
  }
  if (isNaN(value as number)) {
    return ''
  }
  return filesize(value as number)
}

export const formatTimestampAsTimeSinceDuration = (timestamp: unknown) => {
  if ('string' !== typeof timestamp) {
    return ''
  }
  const datetime = DateTime.fromISO(timestamp)
  return datetime.diffNow().negate().rescale().toHuman({
    listStyle: 'long',
    unitDisplay: 'short',
  })!
}
