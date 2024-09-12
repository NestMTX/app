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

  #api?: StreamPrivateApiClient
  #socket?: UnixSocketServer
  #streamer?: ExecaChildProcess
  #staticStreamer?: ExecaChildProcess
  #cameraStreamer?: ExecaChildProcess
  #abortController: AbortController = new AbortController()
  #connectingStreamAbortController: AbortController = new AbortController()

  #iceServers: RTCIceServer[] = []
  #additionalHostAddresses: string[] = []
  #rtspCameraStreamUrl?: string

  get #streamerPassthroughSock() {
    return this.app.makePath('resources', `streamer.${process.pid}.sock`)
  }

  get #streamerFFMpegInputSdp() {
    return this.app.makePath('resources', `streamer.${process.pid}.sdp`)
  }

  get #noSuchCameraFilePath() {
    return this.app.makePath('resources/mediamtx/no-such-camera.jpg')
  }

  get #cameraDisabledFilePath() {
    return this.app.makePath('resources/mediamtx/camera-disabled.jpg')
  }

  get #connectingFilePath() {
    return this.app.makePath('resources/mediamtx/connecting.jpg')
  }

  get #destination() {
    return `srt://127.0.0.1:${env.get('MEDIA_MTX_SRT_PORT', 8890)}/?streamid=publish:${this.path}&pkt_size=1316`
  }

  async run() {
    process.once('SIGINT', this.#gracefulExit.bind(this))
    this.logger.info(`NestMTX Streamer for "${this.path}". PID: ${process.pid}`)
    this.#socket = createServer(this.#onUnixSocketConnection.bind(this))
    this.#socket.listen(this.#streamerPassthroughSock)
    this.#startOutputStreamer()
    const privateApiServerUrl = `http://127.0.0.1:${this.port}`
    this.logger.info(`Searching for Private API Server`)
    await new Promise<void>((resolve) => {
      this.#api = io(privateApiServerUrl, {
        autoConnect: false,
        reconnection: false,
        timeout: 1000,
      })
      this.#api.once('error', () => {
        this.logger.error(`Private API Server not found`)
        process.exit(1)
      })
      this.#api.once('connect', () => {
        this.logger.info(`Private API Server connected`)
      })
      this.#api.once('disconnect', () => {
        this.logger.error(`Private API Server disconnected`)
        process.exit(1)
      })
      Promise.all([
        new Promise<void>((r) => {
          this.#api!.once('ice', (iceServers: RTCIceServer[]) => {
            this.#iceServers = iceServers
            this.logger.info(`ICE Servers configured`)
            r(void 0)
          })
        }),
        new Promise<void>((r) => {
          this.#api!.once('hosts', (additionalHostAddresses: string[]) => {
            this.#additionalHostAddresses = additionalHostAddresses
            this.logger.info(`Hosts configured`)
            r(void 0)
          })
        }),
      ]).then(() => {
        resolve()
      })
      this.#api.connect()
    })
    this.#streamJpegToOutputStream(
      this.#connectingFilePath,
      this.#connectingStreamAbortController.signal
    )
    this.logger.info(`Searching for Camera`)
    const camera = await Camera.findBy({ mtx_path: this.path })
    if (!camera) {
      this.logger.info(`Camera not found`)
      this.#connectingStreamAbortController.abort()
      this.#streamJpegToOutputStream(this.#noSuchCameraFilePath)
    } else if (
      !camera.isEnabled ||
      !camera.protocols ||
      (!camera.protocols.includes('WEB_RTC') && !camera.protocols.includes('RTSP'))
    ) {
      this.logger.info(`Camera disabled`)
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
        this.logger.error(err.message)
        process.exit(1)
      }
    }
  }

  #onUnixSocketConnection(socket: UnixSocket) {
    socket.on('data', (raw) => {
      // console.log(raw)
      // writeFileSync(this.#streamerPassthroughFifo, raw)
      if (this.#streamer) {
        this.#streamer.stdin?.write(raw)
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
      '-i',
      `pipe:`,
      // Single H.264 Video Stream (without B-frames)
      '-c:v',
      'libx264',
      '-tune',
      'zerolatency', // Tune for low latency
      '-x264opts',
      'bframes=0', // No B-frames
      '-preset',
      'ultrafast', // Ultrafast preset
      `-b:v`,
      `100k`, // Set video bitrate dynamically
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
      'mpegts', // Set the format to MPEG-TS
      '-use_wallclock_as_timestamps',
      '1',
      `"${this.#destination}"`, // SRT destination with quotes
    ]
    this.#streamer = execa(ffmpegBinary, ffmpegArgs, {
      stdio: 'pipe',
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
          this.logger.info(`[output] ${line}`)
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
            this.logger.error(`[output] ${line}`)
          } else if (line.includes('INFO')) {
            this.logger.info(`[output] ${line}`)
          } else {
            this.logger.warning(`[output] ${line}`)
          }
        })
    })
    this.#streamer.on('exit', async (code) => {
      this.logger.info(`Streamer exited with code ${code}`)
      if (code !== 0) {
        const res = await this.#streamer
        if (res) {
          this.logger.info(res.escapedCommand)
        }
      }
      this.#gracefulExit(code || 0)
    })
  }

  #streamJpegToOutputStream(src: string, signal?: AbortSignal) {
    const ffmpegBinary = env.get('FFMPEG_BIN', 'ffmpeg')
    const ffmpegArgs = [
      '-loglevel',
      env.get('FFMPEG_DEBUG_LEVEL', 'warning'),
      '-loop',
      '1',
      '-i',
      `${src}`,
      '-f',
      'lavfi',
      '-i',
      'anullsrc=r=48000:cl=stereo',
      '-c:v',
      'libx264',
      '-profile:v',
      'main',
      '-tune',
      'zerolatency',
      '-r',
      '25',
      '-s',
      '640x480',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '32k',

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
      this.logger.error(err.message)
    })
    this.#staticStreamer.stdout!.on('data', (data) => {
      data
        .toString()
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .forEach((line: string) => {
          this.logger.info(`[static] ${line}`)
        })
    })
    this.#staticStreamer.stderr!.on('data', (data) => {
      data
        .toString()
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .forEach((line: string) => {
          this.logger.warning(`[static] ${line}`)
        })
    })
    this.#staticStreamer.on('exit', async (code) => {
      this.logger.info(`Static Input FFMpeg exited with code ${code}`)
      if (signal && signal.aborted) {
        return
      }
      if (code !== 0) {
        const res = await this.#streamer
        if (res) {
          this.logger.info(res.escapedCommand)
        }
        this.#gracefulExit(code || 0)
      } else {
        this.#streamJpegToOutputStream(src)
      }
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
          this.logger.warning('Rate limited. Waiting 30 seconds before retrying')
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
    this.logger.info(`Getting RTSP stream characteristics for "${getHostnameFromRtspUrl(rtspSrc)}"`)
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
      this.logger.error(error.message)
      this.#rtspCameraStreamUrl = undefined
      if (depth > 5) {
        return this.#gracefulExit(1)
      } else {
        this.#connectingStreamAbortController = new AbortController()
        this.#streamJpegToOutputStream(
          this.#connectingFilePath,
          this.#connectingStreamAbortController.signal
        )
        this.#rtspStart(service, camera, depth + 1)
        return
      }
    }
    const videoBitrate = characteristics.video.bitrate || 1000

    const ffmpegArgs: string[] = [
      '-loglevel',
      env.get('FFMPEG_DEBUG_LEVEL', 'warning'), // Suppress most log messages, only show warnings
      '-fflags',
      '+discardcorrupt', // Ignore corrupted frames
      '-re', // Read input at native frame rate
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

      // Single H.264 Video Stream (without B-frames)
      '-c:v',
      'libx264',
      '-tune',
      'zerolatency', // Tune for low latency
      '-x264opts',
      'bframes=0', // No B-frames
      '-preset',
      'ultrafast', // Ultrafast preset
      `-b:v`,
      `${videoBitrate}k`, // Set video bitrate dynamically
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
      `unix:${this.#streamerPassthroughSock}`, // Send output to Unix socket
    ]
    this.#connectingStreamAbortController.abort()
    this.logger.info(`Starting FFMpeg with RTSP stream`)
    this.#cameraStreamer = execa(ffmpegBinary, ffmpegArgs, {
      stdio: 'pipe',
      reject: false,
      shell: true,
      signal: this.#abortController.signal,
    })
    this.#cameraStreamer.catch((err) => {
      this.logger.error(err.message)
    })
    this.#cameraStreamer.stdout!.on('data', (data) => {
      data
        .toString()
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .forEach((line: string) => {
          this.logger.info(`[camera] ${line}`)
        })
    })
    this.#cameraStreamer.stderr!.on('data', (data) => {
      data
        .toString()
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .forEach((line: string) => {
          this.logger.warning(`[camera] ${line}`)
        })
    })
    this.#cameraStreamer.on('exit', async (code) => {
      this.logger.info(`RTSP Camera FFMpeg exited with code ${code}`)
      if (code !== 0) {
        const res = await this.#streamer
        if (res) {
          this.logger.info(res.escapedCommand)
        }
        this.#gracefulExit(code || 0)
      } else {
        this.#connectingStreamAbortController = new AbortController()
        this.#streamJpegToOutputStream(
          this.#connectingFilePath,
          this.#connectingStreamAbortController.signal
        )
        this.#rtspStart(service, camera, 0)
      }
    })
  }

  async #webrtcStart(service: smartdevicemanagement_v1.Smartdevicemanagement, camera: Camera) {
    if (!Array.isArray(this.#iceServers)) {
      throw new Error('Failed to get ICE servers')
    }
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
          this.logger.info('WebRTC Peer connection state: connecting')
          break
        case 'connected':
          this.logger.info('WebRTC Peer connection state: connected')
          break
        case 'disconnected':
        case 'closed':
        case 'failed':
          this.logger.warning('WebRTC Peer connection state: disconnected')
          break
        default:
          this.logger.warning('WebRTC Peer connection state: unknown')
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
      this.logger.info('WebRTC Peer connection established')
    })

    pc.addEventListener('icecandidateerror', (event) => {
      const e = new IceCandidateError(
        event.address,
        event.errorCode,
        event.errorText,
        event.port,
        event.url
      )
      this.logger.error(e)
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
        this.logger.info('Video Stream Started')
        return resolve(void 0)
      })
      videoRtpBus.once('error', (error: Error) => reject(error))
      rtpPromiseAbortController.signal.addEventListener('abort', () => resolve(void 0))
    })

    const audioRtpSending = new Promise<void>((resolve, reject) => {
      audioRtpBus.once('sent', () => {
        this.logger.info('Audio Stream Started')
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
                this.logger.error(error)
                return
              }
              // this.logger.debug(`Sent ${bytes} bytes of video data to 0.0.0.0:${videoPort}`)
              videoRtpBus.emit('sent')
            })
            break

          case 'audio':
            udp.send(rtp.serialize(), audioPort, '0.0.0.0', (error, _bytes) => {
              if (error) {
                this.logger.error(error)
                return
              }
              // this.logger.debug(`Sent ${bytes} bytes of audio data to 0.0.0.0:${audioPort}`)
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

    this.#connectingStreamAbortController.abort()

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
    this.logger.info(`Starting FFMpeg with WebRTC stream`)
    const ffmpegArgs: string[] = [
      '-y', // Overwrite output files
      '-hide_banner', // Hide FFmpeg banner
      '-loglevel',
      env.get('FFMPEG_LOG_LEVEL', 'warning'), // Log level set to warning
      '-protocol_whitelist',
      'file,crypto,data,udp,rtp',

      // SDP input
      '-i',
      `"${this.#streamerFFMpegInputSdp}"`, // SDP File input with quotes

      // Video encoding (H.264)
      '-c:v',
      'copy', // Copy the video codec (no re-encoding)

      // Audio encoding (AAC)
      '-c:a',
      'aac', // Encode audio to AAC
      '-b:a',
      '128k', // Audio bitrate

      // Muxing into MPEG-TS
      '-f',
      'mpegts',
      '-muxdelay',
      '0.2', // Set muxing delay
      '-muxpreload',
      '0.1', // Set mux preload

      // Output to Unix socket
      `unix:${this.#streamerPassthroughSock}`, // Unix socket output for the MPEG-TS stream
    ]

    this.#cameraStreamer = execa(ffmpegBinary, ffmpegArgs, {
      stdio: 'pipe',
      reject: false,
      shell: true,
      signal: this.#abortController.signal,
    })

    this.#cameraStreamer.catch((err) => {
      this.logger.error(err.message)
    })
    this.#cameraStreamer.stdout!.on('data', (data) => {
      data
        .toString()
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .forEach((line: string) => {
          this.logger.info(`[camera] ${line}`)
        })
    })
    this.#cameraStreamer.stderr!.on('data', (data) => {
      data
        .toString()
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .forEach((line: string) => {
          this.logger.warning(`[camera] ${line}`)
        })
    })
    this.#cameraStreamer.on('exit', async (code) => {
      this.logger.info(`WebRTC Camera FFMpeg exited with code ${code}`)
      if (code !== 0) {
        const res = await this.#streamer
        if (res) {
          this.logger.info(res.escapedCommand)
        }
        this.#gracefulExit(code || 0)
      } else {
        this.#connectingStreamAbortController = new AbortController()
        this.#streamJpegToOutputStream(
          this.#connectingFilePath,
          this.#connectingStreamAbortController.signal
        )
        this.#rtspStart(service, camera, 0)
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
    if (this.#socket) {
      this.#socket.close()
    }
    execa('rm', [this.#streamerPassthroughSock, this.#streamerFFMpegInputSdp])
      .catch(() => {})
      .finally(() => {
        process.exit(code)
      })
  }
}
