import { execa } from 'execa'
import { getHostnameFromRtspUrl } from '#utilities/url'
import { logger as main } from '#services/logger'

import {
  MissingStreamCharacteristicsException,
  UndefinedStreamCharacteristicsException,
} from '#exceptions/missing_stream_characteristics_exception'

export { MissingStreamCharacteristicsException, UndefinedStreamCharacteristicsException }

export interface RtspStreamInfo {
  streamID?: string
  width?: number
  height?: number
  depth?: number
  frameRate?: string
  pixelAspectRatio?: string
  interlaced?: boolean
  bitrate?: number
  maxBitrate?: number
  language?: string
  channels?: number
  sampleRate?: number
}

export interface RtspStreamCharacteristics {
  url: string
  video: RtspStreamInfo
  audio: RtspStreamInfo
  duration?: string
  seekable?: boolean
  live?: boolean
  raw: string
}

export interface FFprobeStreamDisposition {
  default: number
  dub?: number
  original?: number
  comment?: number
  lyrics?: number
  karaoke?: number
  forced?: number
  hearing_impaired?: number
  visual_impaired?: number
  clean_effects?: number
  attached_pic?: number
  timed_thumbnails?: number
}

export interface FFprobeStream {
  index: number
  codec_name: string
  codec_long_name: string
  profile: string
  codec_type: string
  codec_tag_string: string
  codec_tag: string
  width?: number
  height?: number
  coded_width?: number
  coded_height?: number
  closed_captions?: number
  film_grain?: number
  has_b_frames?: number
  pix_fmt?: string
  level?: number
  field_order?: string
  refs?: number
  is_avc?: string
  nal_length_size?: string
  r_frame_rate?: string
  avg_frame_rate?: string
  time_base?: string
  start_pts?: number
  start_time?: string
  bits_per_raw_sample?: string
  extradata_size?: number
  disposition?: FFprobeStreamDisposition
  bit_rate?: string // Optional
  max_bit_rate?: string // Optional
  channels?: number // Optional (for audio streams)
  sample_rate?: string // Optional (for audio streams)
  tags?: { language?: string } // Optional
}

export interface FFprobeFormat {
  filename: string
  nb_streams: number
  nb_programs: number
  nb_stream_groups?: number
  format_name: string
  format_long_name: string
  start_time: string
  probe_score: number
  tags?: {
    title: string
  }
}

export interface FFprobeResult {
  streams: FFprobeStream[]
  format: FFprobeFormat
}

// Parse the output for key stream characteristics
const toCamelCase = (str: string) =>
  str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, '')
const toInteger = (str: string) => Number.parseInt(str.replace(/\D/g, ''))
const toBoolean = (str: string) => str === 'true' || str === 'yes'

const getRtspStreamCharacteristicsFromGstDiscoverer = async (
  url: string,
  signal: AbortSignal
): Promise<RtspStreamCharacteristics | undefined> => {
  const logger = main.child({ service: `utilities`, utility: `rtsp` })
  const characteristics: RtspStreamCharacteristics = {
    url,
    audio: {},
    video: {},
    raw: '',
  }
  try {
    const { stdout } = await execa('gst-discoverer-1.0', [url], {
      reject: true,
    })
    characteristics.raw = stdout
  } catch (error) {
    if (signal.aborted) {
      return undefined
    }
    logger.error(
      `Error getting stream characteristics for camera being served by ${getHostnameFromRtspUrl(url)} from gst-discoverer: ${error.message}`
    )
    return undefined
  }
  if (signal.aborted) {
    return undefined
  }
  const lines = characteristics.raw.split('\n')
  let reachedProperties = false
  const goodLines: Array<{ key: string; value: string; spaces: number }> = []
  for (const line of lines) {
    // get the number of preceeding spaces
    const match = line.match(/^\s*/)
    const spaces = match ? match[0].length : 0
    reachedProperties = reachedProperties || line.includes('Properties:')
    if (!reachedProperties) continue
    const parts = line.split(':')
    const key = parts.shift()?.trim()
    const value = parts.join(':').trim()
    if (key) {
      goodLines.push({ key, value, spaces })
    }
  }
  goodLines.forEach((line: { key: string; value: any; spaces: number }, i) => {
    switch (toCamelCase(line.key)) {
      case 'channels':
      case 'sampleRate':
      case 'depth':
      case 'bitrate':
      case 'maxBitrate':
      case 'width':
      case 'height':
        line.value = toInteger(line.value)
        break

      case 'interlaced':
      case 'seekable':
      case 'live':
        line.value = toBoolean(line.value)
        break
    }
    if (line.spaces === 2 && !line.key.includes('container')) {
      // @ts-ignore - we've confused typescript
      characteristics[toCamelCase(line.key) as keyof RtspStreamCharacteristics] = line.value
    }
    if (line.spaces > 6) {
      // find the parent entry which will have 6 spaces
      const parent = goodLines
        .slice(0, i)
        .reverse()
        .find((l) => l.spaces === 6)
      if (parent) {
        if (parent.key.includes('video')) {
          // @ts-ignore - we've confused typescript
          characteristics.video[toCamelCase(line.key) as keyof RtspStreamInfo] = line.value
        }
        if (parent.key.includes('audio')) {
          // @ts-ignore - we've confused typescript
          characteristics.audio[toCamelCase(line.key) as keyof RtspStreamInfo] = line.value
        }
      }
    }
  })
  // Add validation checks
  if (
    characteristics.video?.width === 0 ||
    characteristics.video?.height === 0 ||
    characteristics.video?.frameRate === '0/1' ||
    characteristics.audio?.channels === 0 ||
    characteristics.audio?.sampleRate === 0
  ) {
    // logger.error(
    //   `Error getting stream characteristics for camera being served by ${getHostnameFromRtspUrl(url)} from gst-discoverer: Invalid stream characteristics detected.`
    // )
  }
  const missingCharacteristics = []
  if (!characteristics.video?.width) {
    missingCharacteristics.push('video.width')
  }
  if (!characteristics.video?.height) {
    missingCharacteristics.push('video.height')
  }
  if (!characteristics.video?.frameRate) {
    missingCharacteristics.push('video.frameRate')
  }
  if (missingCharacteristics.length > 0) {
    return undefined
  }
  return characteristics
}

const getRtspStreamCharacteristicsFromFfprobe = async (
  url: string,
  signal: AbortSignal
): Promise<RtspStreamCharacteristics | undefined> => {
  const logger = main.child({ service: `utilities`, utility: `rtsp` })
  const characteristics: RtspStreamCharacteristics = {
    url,
    audio: {},
    video: {},
    raw: '',
  }
  try {
    const { stdout } = await execa(
      'ffprobe',
      [
        '-v',
        'quiet',
        '-print_format',
        'json',
        '-show_format',
        '-show_streams',
        '-i',
        url,
        '-rtsp_transport',
        'udp', // Use TCP for RTSP transport
        '-rw_timeout',
        '6000000',
      ],
      {
        reject: true,
        signal,
      }
    )
    characteristics.raw = stdout
  } catch (error) {
    if (signal.aborted) {
      return undefined
    }
    logger.error(
      `Error getting stream characteristics for camera being served by ${getHostnameFromRtspUrl(url)} from ffprobe: ${error.message}`
    )
    return undefined
  }
  let parsed: FFprobeResult
  try {
    parsed = JSON.parse(characteristics.raw)
  } catch {
    logger.error(
      `Error getting stream characteristics for camera being served by ${getHostnameFromRtspUrl(url)} from ffprobe: Invalid JSON response`
    )
    return undefined
  }
  // Populate the characteristics object with video and audio stream details
  parsed.streams.forEach((stream) => {
    const streamInfo: RtspStreamInfo = {
      streamID: stream.index.toString(),
      width: stream.width,
      height: stream.height,
      depth: stream.bits_per_raw_sample
        ? Number.parseInt(stream.bits_per_raw_sample, 10)
        : undefined,
      frameRate: stream.avg_frame_rate,
      pixelAspectRatio: stream.field_order,
      interlaced: stream.field_order === 'progressive' ? false : true,
      bitrate: stream.bit_rate ? Number.parseInt(stream.bit_rate, 10) : undefined,
      maxBitrate: stream.max_bit_rate ? Number.parseInt(stream.max_bit_rate, 10) : undefined,
    }

    if (stream.codec_type === 'video') {
      characteristics.video = {
        ...streamInfo,
        streamID: stream.index.toString(),
        width: stream.width,
        height: stream.height,
        frameRate: stream.r_frame_rate,
        pixelAspectRatio: stream.field_order,
        interlaced: stream.field_order !== 'progressive',
        bitrate: Number.parseInt(stream.bit_rate || '0'),
        maxBitrate: Number.parseInt(stream.max_bit_rate || '0'),
      }
    } else if (stream.codec_type === 'audio') {
      characteristics.audio = {
        ...streamInfo,
        language: stream.tags?.language || 'unknown',
        channels: stream.channels,
        sampleRate: stream.sample_rate ? Number.parseInt(stream.sample_rate, 10) : undefined,
      }
    }
  })

  // Add format information (seekable, live, and duration)
  characteristics.duration = parsed.format?.start_time
  characteristics.seekable = parsed.format?.start_time !== undefined
  characteristics.live = parsed.format?.format_name === 'rtsp'
  // Add validation checks
  const missingCharacteristics = []
  if (!characteristics.video?.width) {
    missingCharacteristics.push('video.width')
  }
  if (!characteristics.video?.height) {
    missingCharacteristics.push('video.height')
  }
  if (!characteristics.video?.frameRate) {
    missingCharacteristics.push('video.frameRate')
  }
  if (missingCharacteristics.length > 0) {
    return undefined
  }
  return characteristics
}

export const getRtspStreamCharacteristics = async (
  url: string,
  signal?: AbortSignal
): Promise<RtspStreamCharacteristics> => {
  const logger = main.child({ service: `utilities`, utility: `rtsp` })
  const abortController = new AbortController()
  if (signal) {
    signal.addEventListener('abort', () => {
      abortController.abort()
    })
  }
  const result = await new Promise<RtspStreamCharacteristics | undefined>((resolve) => {
    getRtspStreamCharacteristicsFromFfprobe(url, abortController.signal).then((res) => {
      if (res) {
        abortController.abort()
        return resolve(res)
      }
    })
    getRtspStreamCharacteristicsFromGstDiscoverer(url, abortController.signal).then((res) => {
      if (res) {
        abortController.abort()
        return resolve(res)
      }
    })
    if (signal) {
      signal.addEventListener('abort', () => {
        return resolve(undefined)
      })
    }
  })
  if ('undefined' === typeof result) {
    logger.error(
      `Error getting stream characteristics for camera being served by ${getHostnameFromRtspUrl(url)}: No stream characteristics found.`
    )
    throw new UndefinedStreamCharacteristicsException(getHostnameFromRtspUrl(url))
  }
  const missingCharacteristics = []
  if (!result.video?.width) {
    missingCharacteristics.push('video.width')
  }
  if (!result.video?.height) {
    missingCharacteristics.push('video.height')
  }
  if (!result.video?.frameRate) {
    missingCharacteristics.push('video.frameRate')
  }
  if (missingCharacteristics.length > 0) {
    throw new MissingStreamCharacteristicsException(missingCharacteristics, result)
  }
  return result
}
