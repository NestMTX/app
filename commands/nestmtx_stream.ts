import { io } from 'socket.io-client'
import { execa } from 'execa'
import { BaseCommand, args } from '@adonisjs/core/ace'
import { DateTime } from 'luxon'
import { getRtspStreamCharacteristics } from '#utilities/rtsp'
import { getHostnameFromRtspUrl } from '#utilities/url'
import { pickPort } from '#utilities/ports'
import { RTCPeerConnection, RTCRtpCodecParameters } from 'werift'
import { IceCandidateError } from '#services/ice'
import { createSocket } from 'node:dgram'
import { EventEmitter } from 'node:events'
import env from '#start/env'
import Camera from '#models/camera'
import { createServer } from 'node:net'
import { writeFile } from 'node:fs/promises'
import {
  getHardwareAcceleratedDecodingArgumentsFor,
  getHardwareAcceleratedEncodingArgumentsFor,
} from '#utilities/ffmpeg'
import { subProcessLogger as logger } from '#services/logger'

import type { CommandOptions } from '@adonisjs/core/types/ace'
import type { ExecaChildProcess } from 'execa'
import type { smartdevicemanagement_v1 } from 'googleapis'
import type { RtspStreamCharacteristics } from '#utilities/rtsp'
import type { Socket as StreamPrivateApiClient } from 'socket.io-client'
import type { RTCIceServer, RTCTrackEvent } from 'werift'
import type { PickPortOptions } from '#utilities/ports'
import type { Socket as DGramSocket } from 'node:dgram'
import type { Server as UnixSocketServer, Socket as UnixSocket } from 'node:net'

export default class NestmtxStream extends BaseCommand {
  static commandName = 'nestmtx:stream'
  static description = 'Start a stream to the MediaMTX server'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'The path to start the stream for' })
  declare path: string

  @args.string({
    description:
      'The port on which the nestmtx streamer private API is awaiting for connections on',
  })
  declare port: string

  #bus: EventEmitter = new EventEmitter({
    captureRejections: true,
  })

  #api?: StreamPrivateApiClient
  #streamerSocket?: UnixSocketServer
  #cameraSocket?: UnixSocketServer
  #streamer?: ExecaChildProcess
  #staticStreamer?: ExecaChildProcess
  #cameraStreamer?: ExecaChildProcess
  #abortController: AbortController = new AbortController()
  #connectingStreamAbortController: AbortController = new AbortController()

  #iceServers: RTCIceServer[] = []
  #additionalHostAddresses: string[] = []
  #rtspCameraStreamUrl?: string

  #packetsToOutputCount: number = 0
  #packetsToOutputInterval?: NodeJS.Timeout
  #lastThirtyPacketCounts: number[] = []
  #stalled: boolean = false

  get #outputStreamLogger() {
    return logger.child({ stream: 'output' })
  }

  get #cameraStreamLogger() {
    return logger.child({ stream: 'camera' })
  }

  get #streamerPassthroughSock() {
    return this.app.makePath('resources', `streamer.${process.pid}.sock`)
  }

  get #cameraPassthroughSock() {
    return this.app.makePath('resources', `camera.${process.pid}.sock`)
  }

  get #streamerFFMpegInputSdp() {
    return this.app.makePath('resources', `streamer.${process.pid}.sdp`)
  }

  get #noSuchCameraFilePath() {
    return this.app.makePath('resources/mediamtx/no-such-camera.jpg')
  }

  get #connectingFilePath() {
    return this.app.makePath('resources/mediamtx/connecting.jpg')
  }

  get #cameraDisabledFilePath() {
    return this.app.makePath('resources/mediamtx/camera-disabled.jpg')
  }

  get #destination() {
    return `srt://127.0.0.1:${env.get('MEDIA_MTX_SRT_PORT', 8890)}/?streamid=publish:${this.path}&pkt_size=1316`
  }

  get #hardwareAcceleratedDecodingArguments() {
    return getHardwareAcceleratedDecodingArgumentsFor(
      env.get('FFMPEG_HW_ACCELERATOR', ''),
      env.get('FFMPEG_HW_ACCELERATOR_DEVICE', '')
    )
  }

  get #hardwareAcceleratedEncodingArguments() {
    return getHardwareAcceleratedEncodingArgumentsFor(
      env.get('FFMPEG_HW_ACCELERATOR', ''),
      env.get('FFMPEG_HW_ACCELERATOR_DEVICE', '')
    )
  }

  async run() {
    process.once('SIGINT', this.#gracefulExit.bind(this))
    logger.info(`NestMTX Streamer for "${this.path}". PID: ${process.pid}`)
    this.#abortController.signal.addEventListener('abort', () => {
      if (this.#packetsToOutputInterval) {
        clearInterval(this.#packetsToOutputInterval)
      }
    })
    this.#streamerSocket = createServer(this.#onStreamerUnixSocketConnection.bind(this))
    this.#streamerSocket.listen(this.#streamerPassthroughSock)
    this.#cameraSocket = createServer(this.#onCameraUnixSocketConnection.bind(this))
    this.#cameraSocket.listen(this.#cameraPassthroughSock)
    this.#startOutputStreamer()
    const privateApiServerUrl = `http://127.0.0.1:${this.port}`
    logger.info(`Searching for Private API Server`)
    await new Promise<void>((resolve) => {
      this.#api = io(privateApiServerUrl, {
        autoConnect: false,
        reconnection: false,
        timeout: 1000,
      })
      this.#api.once('error', () => {
        logger.error(`Private API Server not found`)
        process.exit(1)
      })
      this.#api.once('connect', () => {
        logger.info(`Private API Server connected`)
      })
      this.#api.once('disconnect', () => {
        logger.error(`Private API Server disconnected`)
        process.exit(1)
      })
      Promise.all([
        new Promise<void>((r) => {
          this.#api!.once('ice', (iceServers: RTCIceServer[]) => {
            this.#iceServers = iceServers
            logger.info(`ICE Servers configured`)
            r(void 0)
          })
        }),
        new Promise<void>((r) => {
          this.#api!.once('hosts', (additionalHostAddresses: string[]) => {
            this.#additionalHostAddresses = additionalHostAddresses
            logger.info(`Hosts configured`)
            r(void 0)
          })
        }),
      ]).then(() => {
        resolve()
      })
      this.#api.connect()
    })
    logger.info(`Searching for Camera`)
    const camera = await Camera.findBy({ mtx_path: this.path })
    this.#packetsToOutputInterval = setInterval(() => {
      const packets = this.#packetsToOutputCount
      this.#api!.emit('packetRate', packets)
      this.#packetsToOutputCount = 0
      this.#lastThirtyPacketCounts.push(packets)
      if (this.#lastThirtyPacketCounts.length > 30) {
        this.#lastThirtyPacketCounts.shift()
      }
      if (
        !this.#stalled &&
        this.#lastThirtyPacketCounts.length === 30 &&
        this.#lastThirtyPacketCounts.every((count) => count === 0) &&
        ((this.#staticStreamer && this.#staticStreamer.pid) ||
          (this.#cameraStreamer && this.#cameraStreamer.pid))
      ) {
        logger.warning(`No packets received in the last 30 seconds. Stall detected.`)
        this.#stalled = true
        this.#bus.emit('stall')
      }
    }, 1000)
    if (!camera) {
      logger.info(`Camera not found`)
      this.#connectingStreamAbortController.abort()
      this.#streamJpegToOutputStream(this.#noSuchCameraFilePath)
    } else if (
      !camera.isEnabled ||
      !camera.protocols ||
      (!camera.protocols.includes('WEB_RTC') && !camera.protocols.includes('RTSP'))
    ) {
      logger.info(`Camera disabled`)
      this.#connectingStreamAbortController.abort()
      this.#streamJpegToOutputStream(this.#cameraDisabledFilePath)
    } else {
      await camera.load('credential')
      const service: smartdevicemanagement_v1.Smartdevicemanagement =
        await camera.credential.getSDMClient()
      try {
        if (camera.protocols.includes('WEB_RTC')) {
          await this.#webrtcStart(service, camera)
        } else if (camera.protocols.includes('RTSP')) {
          await this.#rtspStart(service, camera)
        }
      } catch (err) {
        logger.error(err.message)
        process.exit(1)
      }
    }
  }

  #onStreamerUnixSocketConnection(socket: UnixSocket) {
    socket.on('data', (raw) => {
      // console.log(raw)
      // writeFileSync(this.#streamerPassthroughFifo, raw)
      if (this.#streamer) {
        this.#packetsToOutputCount += 1
        this.#stalled = false
        // @ts-expect-error - this is correct
        this.#streamer.stdio[3].write(raw)
      }
    })
  }

  #onCameraUnixSocketConnection(socket: UnixSocket) {
    socket.on('data', (raw) => {
      // console.log(raw)
      // writeFileSync(this.#streamerPassthroughFifo, raw)
      if (this.#streamer) {
        this.#packetsToOutputCount += 1
        this.#stalled = false
        // @ts-expect-error - this is correct
        this.#streamer.stdio[3].write(raw)
      }
    })
  }

  #startOutputStreamer() {
    const ffmpegBinary = env.get('FFMPEG_BIN', 'ffmpeg')
    const ffmpegArgs = [
      '-loglevel',
      env.get('FFMPEG_DEBUG_LEVEL', 'warning'),
      '-fflags',
      '+discardcorrupt', // Ignore corrupted frames

      // Hardware-accelerated decoding arguments
      ...this.#hardwareAcceleratedDecodingArguments,

      // Input from pipe:3
      '-i',
      `pipe:3`,

      // Hardware-accelerated encoding arguments (no conflict now)
      ...this.#hardwareAcceleratedEncodingArguments,

      // Other video options such as tune, bitrate, etc.
      '-tune',
      'zerolatency', // Tune for low latency
      '-x264opts',
      'bframes=0', // No B-frames
      '-preset',
      'ultrafast', // Ultrafast preset
      '-b:v',
      '100k', // Set video bitrate dynamically
      '-r',
      '10', // Set frame rate dynamically

      // Set pixel format to avoid deprecated warning
      '-pix_fmt',
      'yuv420p',

      // AAC Audio Stream (track 1)
      '-c:a:0',
      'aac',
      '-b:a:0',
      '128k', // Audio bitrate for AAC

      // Opus Audio Stream (track 2)
      '-c:a:1',
      'libopus',
      '-b:a:1',
      '128k', // Audio bitrate for Opus

      // Explicit Mapping of Video and Audio Streams
      '-map',
      '0:v:0', // Map the first video track (H.264)
      '-map',
      '0:a:0', // Map the first audio track (AAC)
      '-map',
      '0:a:1', // Map the second audio track (Opus)

      // Output Format
      '-f',
      'mpegts', // Set the format to MPEG-TS
      '-use_wallclock_as_timestamps',
      '1',

      // Destination (SRT or other media server)
      `"${this.#destination}"`, // Destination path (quoted)
    ]

    this.#streamer = execa(ffmpegBinary, ffmpegArgs, {
      stdio: ['pipe', 'pipe', 'pipe', 'pipe'],
      reject: false,
      shell: true,
      signal: this.#abortController.signal,
    })
    this.#streamer.stdout!.on('data', (data) => {
      data
        .toString()
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .forEach((line: string) => {
          this.#outputStreamLogger.info(line)
        })
    })
    this.#streamer.stderr!.on('data', (data) => {
      data
        .toString()
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .forEach((line: string) => {
          if (line.includes('ERROR')) {
            this.#outputStreamLogger.error(line)
          } else if (line.includes('INFO')) {
            this.#outputStreamLogger.info(line)
          } else {
            this.#outputStreamLogger.warning(line)
          }
        })
    })
    this.#streamer.on('exit', async (code) => {
      logger.info(`Streamer exited with code ${code}`)
      if (code !== 0 && code !== 8) {
        const res = await this.#streamer
        if (res) {
          logger.info(res.escapedCommand)
        }
      }
      this.#gracefulExit(code || 0)
    })
  }

  #streamJpegToOutputStream(src: string, size: string = '640x480', signal?: AbortSignal) {
    const ffmpegBinary = env.get('FFMPEG_BIN', 'ffmpeg')
    const ffmpegArgs = [
      '-loglevel',
      env.get('FFMPEG_DEBUG_LEVEL', 'warning'),
      '-loop',
      '1',
      // Hardware-accelerated decoding arguments
      ...this.#hardwareAcceleratedDecodingArguments,
      '-i',
      `${src}`,
      '-f',
      'lavfi',
      '-i',
      'anullsrc=r=48000:cl=stereo', // Synthetic audio source
      // Hardware-accelerated encoding arguments (no conflict now)
      ...this.#hardwareAcceleratedEncodingArguments,
      '-profile:v',
      'main',
      '-tune',
      'zerolatency',
      '-r',
      '25',
      '-s',
      size,
      '-pix_fmt',
      'yuv420p',

      // AAC Audio Stream (track 1)
      '-c:a:0',
      'aac',
      '-b:a:0',
      '128k', // Audio bitrate for AAC

      // Opus Audio Stream (track 2)
      '-c:a:1',
      'libopus',
      '-b:a:1',
      '128k', // Audio bitrate for Opus

      // Mapping inputs and outputs
      '-map',
      '0:v', // Map the video input to the H.264 video stream (image source)
      '-map',
      '1:a', // Map the synthetic audio source to the AAC stream
      '-map',
      '1:a', // Map the synthetic audio source again for Opus encoding

      '-f',
      'mpegts',
      '-listen',
      '0',
      `unix:${this.#streamerPassthroughSock}`, // Send output to Unix socket
    ]

    this.#staticStreamer = execa(ffmpegBinary, ffmpegArgs, {
      stdio: 'pipe',
      reject: false,
      shell: true,
      signal,
    })
    this.#staticStreamer.catch((err) => {
      logger.error(err.message)
    })
    this.#staticStreamer.stdout!.on('data', (data) => {
      data
        .toString()
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .forEach((line: string) => {
          logger.info(`[static] ${line}`)
        })
    })
    this.#staticStreamer.stderr!.on('data', (data) => {
      data
        .toString()
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .forEach((line: string) => {
          logger.warning(`[static] ${line}`)
        })
    })
    this.#staticStreamer.on('exit', async (code, es?: NodeJS.Signals) => {
      logger.info(`Static Input FFMpeg exited with code ${code}`)
      if (signal && signal.aborted) {
        return
      }
      if (code !== 0 && code !== 8 && es !== 'SIGABRT') {
        const res = await this.#streamer
        if (res) {
          logger.info(res.escapedCommand)
        }
        this.#gracefulExit(code || 0)
      } else {
        this.#streamJpegToOutputStream(src, size, signal)
      }
    })
    this.#bus.once('stall', () => {
      this.#staticStreamer!.kill('SIGABRT')
    })
  }

  async #getRtspUrl(service: smartdevicemanagement_v1.Smartdevicemanagement, camera: Camera) {
    while ('string' !== typeof this.#rtspCameraStreamUrl) {
      let rtspUrl: any | undefined
      let streamExtensionToken: string | undefined
      let expiresAt: string | undefined
      try {
        const {
          data: { results },
        } = await service.enterprises.devices.executeCommand({
          name: camera.uid,
          requestBody: {
            command: 'sdm.devices.commands.CameraLiveStream.GenerateRtspStream',
          },
        })
        if (!results!.streamUrls || !results!.streamUrls.rtspUrl) {
          throw new Error('RTSP Stream URL not found')
        }
        if (!results!.streamExtensionToken) {
          throw new Error('No stream extension token found')
        }
        rtspUrl = results!.streamUrls.rtspUrl
        streamExtensionToken = results!.streamExtensionToken
        expiresAt = results!.expiresAt
      } catch (error) {
        if ((error as Error).message.includes('Rate limited')) {
          logger.warning('Rate limited. Waiting 30 seconds before retrying')
          await new Promise((r) => setTimeout(r, 30000))
        } else {
          this.#gracefulExit(1)
        }
      }
      camera.streamExtensionToken = streamExtensionToken || null
      camera.expiresAt = DateTime.utc().plus({ minutes: 5 })
      if (expiresAt) {
        const expiresAtDateTime = DateTime.fromISO(expiresAt)
        if (expiresAtDateTime.isValid) {
          camera.expiresAt = expiresAtDateTime
        }
      }
      await camera.save()
      this.#rtspCameraStreamUrl = rtspUrl
    }
    return this.#rtspCameraStreamUrl
  }

  async #rtspStart(
    service: smartdevicemanagement_v1.Smartdevicemanagement,
    camera: Camera,
    depth: number = 0
  ) {
    const ffmpegBinary = env.get('FFMPEG_BIN', 'ffmpeg')
    const rtspSrc = await this.#getRtspUrl(service, camera)
    logger.info(`Getting RTSP stream characteristics for "${getHostnameFromRtspUrl(rtspSrc)}"`)
    const getCharacteristicsAbortController = new AbortController()
    setTimeout(() => {
      getCharacteristicsAbortController.abort()
    }, 30000)
    let characteristics: RtspStreamCharacteristics
    try {
      characteristics = await getRtspStreamCharacteristics(
        rtspSrc,
        getCharacteristicsAbortController.signal
      )
    } catch (error) {
      logger.error(error.message)
      this.#rtspCameraStreamUrl = undefined
      if (depth > 5) {
        return this.#gracefulExit(1)
      } else {
        this.#rtspStart(service, camera, depth + 1)
        return
      }
    }
    const videoBitrate = characteristics.video.bitrate || 1000
    const size =
      characteristics.video.width && characteristics.video.height
        ? `${characteristics.video.width}x${characteristics.video.height}`
        : camera.resolution || '640x480'

    const videoSizeArguments =
      characteristics.video.width && characteristics.video.height ? ['-s', size] : []

    const ffmpegArgs: string[] = [
      '-loglevel',
      env.get('FFMPEG_DEBUG_LEVEL', 'warning'), // Suppress most log messages, only show warnings
      '-fflags',
      '+discardcorrupt', // Ignore corrupted frames
      '-re', // Read input at native frame rate

      // Hardware-accelerated decoding arguments
      ...this.#hardwareAcceleratedDecodingArguments,

      '-i',
      `"${rtspSrc}"`, // Input RTSP stream with quotes

      // Retry options for network issues
      '-rtsp_transport',
      'udp', // Use TCP for RTSP transport

      // Add timeouts to avoid premature exits
      '-timeout',
      '6000000', // Wait up to 1 minute for the RTSP stream to start
      '-rw_timeout',
      '6000000',

      // Hardware-accelerated encoding arguments (no conflict now)
      ...this.#hardwareAcceleratedEncodingArguments,

      // Single H.264 Video Stream (without B-frames)
      '-tune',
      'zerolatency', // Tune for low latency
      '-x264opts',
      'bframes=0', // No B-frames
      '-preset',
      'ultrafast', // Ultrafast preset
      `-b:v`,
      `${videoBitrate}k`, // Set video bitrate dynamically
      ...videoSizeArguments,
      '-r',
      `10`, // Set frame rate dynamically

      // Set pixel format to avoid deprecated warning
      '-pix_fmt',
      'yuv420p',

      // AAC Audio Stream
      '-c:a:0',
      'aac',
      '-b:a:0',
      '128k', // Audio bitrate for AAC

      // Opus Audio Stream
      '-c:a:1',
      'libopus',
      '-b:a:1',
      '128k', // Audio bitrate for Opus

      // Mapping inputs and outputs
      '-map',
      '0:v', // Map the video input to the H.264 video stream
      '-map',
      '0:a', // Map the original AAC audio to the first audio track
      '-map',
      '0:a', // Map the original audio again for Opus encoding

      '-f',
      'mpegts',
      '-listen',
      '0',
      `unix:${this.#cameraPassthroughSock}`, // Send output to Unix socket
    ]
    this.#connectingStreamAbortController.abort()
    logger.info(`Starting FFMpeg with RTSP stream`)
    this.#cameraStreamer = execa(ffmpegBinary, ffmpegArgs, {
      stdio: 'pipe',
      reject: false,
      shell: true,
      signal: this.#abortController.signal,
    })
    this.#cameraStreamer.catch((err) => {
      logger.error(err.message)
    })
    this.#cameraStreamer.stdout!.on('data', (data) => {
      data
        .toString()
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .forEach((line: string) => {
          this.#cameraStreamLogger.info(line)
        })
    })
    this.#cameraStreamer.stderr!.on('data', (data) => {
      data
        .toString()
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .forEach((line: string) => {
          this.#cameraStreamLogger.warning(line)
        })
    })
    this.#cameraStreamer.on('exit', async (code, es?: NodeJS.Signals) => {
      logger.info(`RTSP Camera FFMpeg exited with code ${code}`)
      if (code !== 0 && code !== 8 && es !== 'SIGABRT') {
        const res = await this.#streamer
        if (res) {
          logger.info(res.escapedCommand)
        }
        this.#gracefulExit(code || 0)
      } else {
        this.#connectingStreamAbortController = new AbortController()
        this.#streamJpegToOutputStream(
          this.#connectingFilePath,
          size,
          this.#connectingStreamAbortController.signal
        )
        this.#rtspStart(service, camera, 0)
      }
    })
    this.#bus.once('stall', () => {
      this.#staticStreamer!.kill('SIGABRT')
    })
  }

  async #webrtcStart(service: smartdevicemanagement_v1.Smartdevicemanagement, camera: Camera) {
    if (!Array.isArray(this.#iceServers)) {
      throw new Error('Failed to get ICE servers')
    }

    this.#connectingStreamAbortController = new AbortController()
    this.#streamJpegToOutputStream(
      this.#connectingFilePath,
      '1920x1080',
      this.#connectingStreamAbortController.signal
    )

    const getPortOptions: PickPortOptions = {
      type: 'udp',
      ip: '0.0.0.0',
      reserveTimeout: 15,
      minPort: env.get('WEBRTC_RTP_MIN_PORT', 10000),
      maxPort: env.get('WEBRTC_RTP_MAX_PORT', 20000),
    }
    // const gstreamerBinary = env.get('GSTREAMER_BIN', 'gst-launch-1.0')
    const ffmpegBinary = env.get('FFMPEG_BIN', 'ffmpeg')
    const audioPort = await pickPort(getPortOptions)
    const audioRTCPPort = await pickPort(getPortOptions)
    const videoPort = await pickPort(getPortOptions)
    const videoRTCPPort = await pickPort(getPortOptions)
    const udp: DGramSocket = createSocket('udp4')

    const pc = new RTCPeerConnection({
      bundlePolicy: 'max-bundle',
      codecs: {
        audio: [
          new RTCRtpCodecParameters({
            mimeType: 'audio/opus',
            clockRate: 48000,
            channels: 2,
          }),
        ],
        video: [
          new RTCRtpCodecParameters({
            mimeType: 'video/H264',
            clockRate: 90000,
            rtcpFeedback: [
              { type: 'transport-cc' },
              { type: 'ccm', parameter: 'fir' },
              { type: 'nack' },
              { type: 'nack', parameter: 'pli' },
              { type: 'goog-remb' },
            ],
            parameters: 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f',
          }),
        ],
      },
      iceServers: this.#iceServers,
      iceAdditionalHostAddresses: this.#additionalHostAddresses,
      iceTransportPolicy: 'all',
    })

    pc.addEventListener('connectionstatechange', () => {
      switch (pc.connectionState) {
        case 'new':
        case 'connecting':
          logger.info('WebRTC Peer connection state: connecting')
          break
        case 'connected':
          logger.info('WebRTC Peer connection state: connected')
          break
        case 'disconnected':
        case 'closed':
        case 'failed':
          logger.warning('WebRTC Peer connection state: disconnected')
          break
        default:
          logger.warning('WebRTC Peer connection state: unknown')
          break
      }
    })

    const peerConnectedAbortController = new AbortController()

    const peerConnected = new Promise<void>((resolve, reject) => {
      const onConnectionStateChange = () => {
        switch (pc.connectionState) {
          case 'connected':
            pc.removeEventListener('connectionstatechange', onConnectionStateChange)
            return resolve(void 0)
          case 'disconnected':
          case 'closed':
          case 'failed':
            pc.removeEventListener('connectionstatechange', onConnectionStateChange)
            return reject(new Error('WebRTC Peer connection failed'))
          default:
            break
        }
      }
      pc.addEventListener('connectionstatechange', onConnectionStateChange)
      peerConnectedAbortController.signal.addEventListener('abort', () =>
        // reject(new Error('Aborted'))
        resolve(void 0)
      )
    })

    peerConnected.then(() => {
      logger.info('WebRTC Peer connection established')
    })

    pc.addEventListener('icecandidateerror', (event) => {
      const e = new IceCandidateError(
        event.address,
        event.errorCode,
        event.errorText,
        event.port,
        event.url
      )
      logger.error(e)
    })

    const videoRtpBus = new EventEmitter({
      captureRejections: true,
    })

    const audioRtpBus = new EventEmitter({
      captureRejections: true,
    })

    const rtpPromiseAbortController = new AbortController()

    const videoRtpSending = new Promise<void>((resolve, reject) => {
      videoRtpBus.once('sent', () => {
        logger.info('Video Stream Started')
        return resolve(void 0)
      })
      videoRtpBus.once('error', (error: Error) => reject(error))
      rtpPromiseAbortController.signal.addEventListener('abort', () => resolve(void 0))
    })

    const audioRtpSending = new Promise<void>((resolve, reject) => {
      audioRtpBus.once('sent', () => {
        logger.info('Audio Stream Started')
        resolve(void 0)
      })
      audioRtpBus.once('error', (error: Error) => reject(error))
      rtpPromiseAbortController.signal.addEventListener('abort', () => resolve(void 0))
    })

    pc.addEventListener('track', (event: RTCTrackEvent) => {
      const { unSubscribe } = event.track.onReceiveRtp.subscribe((rtp) => {
        switch (event.track.kind) {
          case 'video':
            udp.send(rtp.serialize(), videoPort, '0.0.0.0', (error, _bytes) => {
              if (error) {
                logger.error(error)
                return
              }
              // logger.debug(`Sent ${bytes} bytes of video data to 0.0.0.0:${videoPort}`)
              videoRtpBus.emit('sent')
            })
            break

          case 'audio':
            udp.send(rtp.serialize(), audioPort, '0.0.0.0', (error, _bytes) => {
              if (error) {
                logger.error(error)
                return
              }
              // logger.debug(`Sent ${bytes} bytes of audio data to 0.0.0.0:${audioPort}`)
              audioRtpBus.emit('sent')
            })
            break

          default:
            break
        }
      })
      rtpPromiseAbortController.signal.addEventListener('abort', () => unSubscribe())
    })

    try {
      pc.addTransceiver('audio', { direction: 'recvonly' })
    } catch (error) {
      throw new Error(`Failed to add audio transceiver: ${error.message}`)
    }

    try {
      pc.addTransceiver('video', { direction: 'recvonly' })
    } catch (error) {
      throw new Error(`Failed to add video transceiver: ${error.message}`)
    }

    // Add a data channel to include the application m line in SDP
    pc.createDataChannel('dataSendChannel', { id: 1 })

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    const {
      data: { results },
    } = await service.enterprises.devices.executeCommand({
      name: camera.uid,
      requestBody: {
        command: 'sdm.devices.commands.CameraLiveStream.GenerateWebRtcStream',
        params: {
          offerSdp: offer.sdp,
        },
      },
    })

    if (!results!.answerSdp) {
      throw new Error('WebRTC Answer SDP not found')
    }
    if (!results!.mediaSessionId) {
      throw new Error('Media Session ID not found')
    }

    camera.streamExtensionToken = results!.mediaSessionId
    camera.expiresAt = DateTime.utc().plus({ minutes: 5 })
    if (results!.expiresAt) {
      const expiresAt = DateTime.fromISO(results!.expiresAt)
      if (expiresAt.isValid) {
        camera.expiresAt = expiresAt
      }
    }
    await camera.save()

    await pc.setRemoteDescription({
      type: 'answer',
      sdp: results!.answerSdp,
    })

    await Promise.all([videoRtpSending, audioRtpSending])

    const sdp = `v=0
o=- 0 0 IN IP4 127.0.0.1
s=FFmpeg RTP Stream
c=IN IP4 127.0.0.1
t=0 0

m=video ${videoPort} RTP/AVP 97
a=rtpmap:97 H264/90000
a=recvonly
a=rtcp:${videoRTCPPort}

m=audio ${audioPort} RTP/AVP 96
a=rtpmap:96 OPUS/48000/2
a=recvonly
a=rtcp:${audioRTCPPort}
`

    await writeFile(this.#streamerFFMpegInputSdp, sdp)
    this.#connectingStreamAbortController.abort()
    logger.info(`Starting FFMpeg with WebRTC stream`)
    const ffmpegArgs: string[] = [
      '-y', // Overwrite output files
      '-hide_banner', // Hide FFmpeg banner
      '-loglevel',
      env.get('FFMPEG_LOG_LEVEL', 'warning'), // Log level set to warning
      '-protocol_whitelist',
      'file,crypto,data,udp,rtp',

      // Hardware-accelerated decoding arguments
      ...this.#hardwareAcceleratedDecodingArguments,

      // SDP input
      '-i',
      `"${this.#streamerFFMpegInputSdp}"`, // SDP File input with quotes

      // Hardware-accelerated encoding arguments (no conflict now)
      ...this.#hardwareAcceleratedEncodingArguments,

      '-tune',
      'zerolatency', // Tune for low latency
      '-x264opts',
      'bframes=0', // No B-frames
      '-preset',
      'ultrafast', // Ultrafast preset
      '-b:v',
      '100k', // Set video bitrate dynamically
      '-r',
      '10', // Set frame rate dynamically
      // 'copy', // Copy the video codec (no re-encoding)
      '-s',
      '1920x1080', // Set video size
      '-pix_fmt',
      'yuv420p',

      // // Audio encoding (AAC)
      // '-c:a',
      // 'aac', // Encode audio to AAC
      // '-b:a',
      // '128k', // Audio bitrate

      // AAC Audio Stream (track 1)
      '-c:a:0',
      'aac',
      '-b:a:0',
      '128k', // Audio bitrate for AAC

      // Opus Audio Stream (track 2)
      '-c:a:1',
      'libopus',
      '-b:a:1',
      '128k', // Audio bitrate for Opus

      // Mapping inputs and outputs
      '-map',
      '0:v', // Map the video input to the H.264 video stream
      '-map',
      '0:a', // Map the original AAC audio to the first audio track
      '-map',
      '0:a', // Map the original audio again for Opus encoding

      // Muxing into MPEG-TS
      '-f',
      'mpegts',
      '-muxdelay',
      '0.2', // Set muxing delay
      '-muxpreload',
      '0.1', // Set mux preload

      // Output to Unix socket
      `unix:${this.#cameraPassthroughSock}`, // Unix socket output for the MPEG-TS stream
    ]

    this.#cameraStreamer = execa(ffmpegBinary, ffmpegArgs, {
      stdio: 'pipe',
      reject: false,
      shell: true,
      signal: this.#abortController.signal,
    })

    this.#cameraStreamer.catch((err) => {
      logger.error(err.message)
    })
    this.#cameraStreamer.stdout!.on('data', (data) => {
      data
        .toString()
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .forEach((line: string) => {
          this.#cameraStreamLogger.info(line)
        })
    })
    this.#cameraStreamer.stderr!.on('data', (data) => {
      data
        .toString()
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .forEach((line: string) => {
          this.#cameraStreamLogger.warning(line)
        })
    })
    this.#cameraStreamer.on('exit', async (code, es?: NodeJS.Signals) => {
      logger.info(`WebRTC Camera FFMpeg exited with code ${code}`)
      if (code !== 0 && code !== 8 && es !== 'SIGABRT') {
        const res = await this.#streamer
        if (res) {
          logger.info(res.escapedCommand)
        }
        this.#gracefulExit(code || 0)
      } else {
        this.#webrtcStart(service, camera)
      }
    })
  }

  #gracefulExit(code: number = 0) {
    if (this.#streamer) {
      this.#streamer.kill('SIGKILL')
    }
    if (this.#staticStreamer) {
      this.#staticStreamer.kill('SIGKILL')
    }
    if (this.#cameraStreamer) {
      this.#cameraStreamer.kill('SIGKILL')
    }
    if (this.#streamerSocket) {
      this.#streamerSocket.close()
    }
    execa('rm', [this.#streamerPassthroughSock, this.#streamerFFMpegInputSdp])
      .catch(() => {})
      .finally(() => {
        process.exit(code)
      })
  }
}
