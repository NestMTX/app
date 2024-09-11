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
import { writeFileSync } from 'node:fs'

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
  #abortController: AbortController = new AbortController()

  #cameraMissingPort?: number
  #cameraDisabledPort?: number
  #cameraConnectingPort?: number

  #iceServers: RTCIceServer[] = []
  #additionalHostAddresses: string[] = []

  get #streamerPassthroughSock() {
    return this.app.makePath('resources', `streamer.${process.pid}.sock`)
  }

  // get #cameraMissingMjpegStream() {
  //   return `http://127.0.0.1:${this.#cameraMissingPort}`
  // }

  // get #cameraDisabledMjpegStream() {
  //   return `http://127.0.0.1:${this.#cameraDisabledPort}`
  // }

  // get #cameraConnectingMjpegStream() {
  //   return `http://127.0.0.1:${this.#cameraConnectingPort}`
  // }

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

  get #location() {
    return `rtsp://127.0.0.1:${env.get('MEDIA_MTX_RTSP_TCP_PORT', 8554)}/${this.path}`
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
    this.#streamJpegToOutputStream(this.#connectingFilePath)
    this.logger.info(`Searching for Camera`)
    const camera = await Camera.findBy({ mtx_path: this.path })
    // if (!camera) {
    //   this.logger.info(`Camera not found`)
    //   this.#streamJpegToOutputStream(this.#cameraMissingMjpegStream)
    // } else if (
    //   !camera.isEnabled ||
    //   !camera.protocols ||
    //   (!camera.protocols.includes('WEB_RTC') && !camera.protocols.includes('RTSP'))
    // ) {
    //   this.logger.info(`Camera disabled`)
    //   this.#streamJpegToOutputStream(this.#cameraDisabledMjpegStream)
    // } else {
    // await camera.load('credential')
    // const service: smartdevicemanagement_v1.Smartdevicemanagement =
    //   await camera.credential.getSDMClient()
    // try {
    //   if (camera.protocols.includes('WEB_RTC')) {
    //     await this.#webrtcStart(service, camera)
    //   } else if (camera.protocols.includes('RTSP')) {
    //     await this.#rtspStart(service, camera)
    //   }
    // } catch (err) {
    //   this.logger.error(err.message)
    //   process.exit(1)
    // }
    // }
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
    const gstreamerBinary = env.get('GSTREAMER_BIN', 'gst-launch-1.0')
    this.#streamer = execa(
      gstreamerBinary,
      [
        '-q', // Quiet mode
        `--gst-debug-level=${env.get('GSTREAMER_DEBUG_LEVEL', '2')}`, // Set log level

        // Input stream
        'fdsrc',
        'fd=0',
        'timeout=0',
        '!',
        'decodebin',
        '!',
        'tsdemux',
        'name=demux',

        // Video track handling
        'demux.video_0',
        '!',
        'queue',
        '!',
        'h264parse',
        '!',
        'mux.',

        // Audio track handling - first (AAC)
        'demux.audio_0',
        '!',
        'queue',
        '!',
        'decodebin',
        '!',
        'tee',
        'name=audio_tee',
        'audio_tee.',
        '!',
        'queue',
        '!',
        'audioconvert',
        '!',
        'avenc_aac',
        'bitrate=128000',
        '!',
        'aacparse',
        '!',
        'mux.',

        // Audio track handling - second (Opus)
        'audio_tee.',
        '!',
        'queue',
        '!',
        'audioconvert',
        '!',
        'opusenc',
        'bitrate=128000',
        '!',
        'opusparse',
        '!',
        'mux.',

        // Muxing
        'matroskamux', // Matroska container format
        'name=mux',
        'streamable=true', // Streamable output

        // SRT Output
        'srtsink',
        'latency=100',
        'localaddress="127.0.0.1"',
        'mode="caller"',
        `uri="${this.#destination}"`, // SRT URL, wrapped in quotes
      ],
      {
        stdio: 'pipe',
        reject: false,
        shell: true,
        signal: this.#abortController.signal,
      }
    )
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

  #streamJpegToOutputStream(src: string) {
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
      '-tune',
      'zerolatency',
      '-b:v',
      '100k',
      '-r',
      '1',
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
      if (code !== 0) {
        const res = await this.#streamer
        if (res) {
          this.logger.info(res.escapedCommand)
        }
      } else {
        this.#streamJpegToOutputStream(src)
      }
      this.#gracefulExit(code || 0)
    })
  }

  // async #rtspStart(service: smartdevicemanagement_v1.Smartdevicemanagement, camera: Camera) {
  //   const ffmpegBinary = env.get('FFMPEG_BIN', 'ffmpeg')
  //   const {
  //     data: { results },
  //   } = await service.enterprises.devices.executeCommand({
  //     name: camera.uid,
  //     requestBody: {
  //       command: 'sdm.devices.commands.CameraLiveStream.GenerateRtspStream',
  //     },
  //   })
  //   if (!results!.streamUrls || !results!.streamUrls.rtspUrl) {
  //     throw new Error('RTSP Stream URL not found')
  //   }
  //   if (!results!.streamExtensionToken) {
  //     throw new Error('No stream extension token found')
  //   }

  //   camera.streamExtensionToken = results!.streamExtensionToken
  //   camera.expiresAt = DateTime.utc().plus({ minutes: 5 })
  //   if (results!.expiresAt) {
  //     const expiresAt = DateTime.fromISO(results!.expiresAt)
  //     if (expiresAt.isValid) {
  //       camera.expiresAt = expiresAt
  //     }
  //   }
  //   await camera.save()
  //   const rtspSrc = results!.streamUrls.rtspUrl
  //   this.logger.info(`Getting RTSP stream characteristics for "${getHostnameFromRtspUrl(rtspSrc)}"`)
  //   const getCharacteristicsAbortController = new AbortController()
  //   setTimeout(() => {
  //     getCharacteristicsAbortController.abort()
  //   }, 30000)
  //   const characteristics: RtspStreamCharacteristics = await getRtspStreamCharacteristics(
  //     rtspSrc,
  //     getCharacteristicsAbortController.signal
  //   )
  //   const videoBitrate = characteristics.video.bitrate || 1000

  //   const ffmpegArgs: string[] = [
  //     '-loglevel',
  //     env.get('FFMPEG_DEBUG_LEVEL', 'warning'), // Suppress most log messages, only show warnings
  //     '-fflags',
  //     '+discardcorrupt', // Ignore corrupted frames
  //     '-re', // Read input at native frame rate
  //     '-i',
  //     `"${rtspSrc}"`, // Input RTSP stream with quotes

  //     // Retry options for network issues
  //     '-rtsp_transport',
  //     'udp', // Use TCP for RTSP transport

  //     // Add timeouts to avoid premature exits
  //     '-timeout',
  //     '6000000', // Wait up to 1 minute for the RTSP stream to start
  //     '-rw_timeout',
  //     '6000000',

  //     // Single H.264 Video Stream (without B-frames)
  //     '-c:v',
  //     'libx264',
  //     '-tune',
  //     'zerolatency', // Tune for low latency
  //     '-x264opts',
  //     'bframes=0', // No B-frames
  //     '-preset',
  //     'ultrafast', // Ultrafast preset
  //     `-b:v`,
  //     `${videoBitrate}k`, // Set video bitrate dynamically
  //     '-r',
  //     `10`, // Set frame rate dynamically

  //     // Set pixel format to avoid deprecated warning
  //     '-pix_fmt',
  //     'yuv420p',

  //     // AAC Audio Stream
  //     '-c:a:0',
  //     'aac',
  //     '-b:a:0',
  //     '128k', // Audio bitrate for AAC

  //     // Opus Audio Stream
  //     '-c:a:1',
  //     'libopus',
  //     '-b:a:1',
  //     '128k', // Audio bitrate for Opus

  //     // Mapping inputs and outputs
  //     '-map',
  //     '0:v', // Map the video input to the H.264 video stream
  //     '-map',
  //     '0:a', // Map the original AAC audio to the first audio track
  //     '-map',
  //     '0:a', // Map the original audio again for Opus encoding

  //     '-f',
  //     'mpegts', // Set the format to MPEG-TS
  //     '-use_wallclock_as_timestamps',
  //     '1',
  //     `"${this.#destination}"`, // SRT destination with quotes
  //   ]

  //   this.logger.info(`Starting FFMpeg with RTSP stream`)
  //   this.#streamer = execa(ffmpegBinary, ffmpegArgs, {
  //     stdio: 'pipe',
  //     reject: false,
  //     shell: true,
  //     signal: this.#abortController.signal,
  //   })

  //   this.#streamer.stdout!.on('data', (data) => {
  //     this.logger.info(data.toString())
  //   })

  //   this.#streamer.stderr!.on('data', (data) => {
  //     this.logger.warning(data.toString())
  //   })

  //   this.#streamer.on('exit', async (code) => {
  //     if (code === 255) {
  //       return
  //     }
  //     if (code === 8) {
  //       const result = await this.#streamer
  //       this.logger.error(`${result!.escapedCommand} failed with code ${result!.exitCode}`)
  //     } else {
  //       this.logger.info(`FFMpeg exited with code ${code}`)
  //     }
  //     if (code === 0) {
  //       this.logger.info(`FFMpeg exited with code ${code}. Restarting.`)
  //       this.#streamer = execa(ffmpegBinary, ffmpegArgs, {
  //         stdio: 'pipe',
  //         reject: false,
  //         shell: true,
  //         signal: this.#abortController.signal,
  //       })
  //       return
  //     }
  //     process.exit(code ? code : 0)
  //   })
  // }

  // async #webrtcStart(service: smartdevicemanagement_v1.Smartdevicemanagement, camera: Camera) {
  //   if (!Array.isArray(this.#iceServers)) {
  //     throw new Error('Failed to get ICE servers')
  //   }
  //   const getPortOptions: PickPortOptions = {
  //     type: 'udp',
  //     ip: '0.0.0.0',
  //     reserveTimeout: 15,
  //     minPort: env.get('WEBRTC_RTP_MIN_PORT', 10000),
  //     maxPort: env.get('WEBRTC_RTP_MAX_PORT', 20000),
  //   }
  //   const gstreamerBinary = env.get('GSTREAMER_BIN', 'gst-launch-1.0')
  //   const audioPort = await pickPort(getPortOptions)
  //   const videoPort = await pickPort(getPortOptions)
  //   const udp: DGramSocket = createSocket('udp4')

  //   const pc = new RTCPeerConnection({
  //     bundlePolicy: 'max-bundle',
  //     codecs: {
  //       audio: [
  //         new RTCRtpCodecParameters({
  //           mimeType: 'audio/opus',
  //           clockRate: 48000,
  //           channels: 2,
  //         }),
  //       ],
  //       video: [
  //         new RTCRtpCodecParameters({
  //           mimeType: 'video/H264',
  //           clockRate: 90000,
  //           rtcpFeedback: [
  //             { type: 'transport-cc' },
  //             { type: 'ccm', parameter: 'fir' },
  //             { type: 'nack' },
  //             { type: 'nack', parameter: 'pli' },
  //             { type: 'goog-remb' },
  //           ],
  //           parameters: 'level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f',
  //         }),
  //       ],
  //     },
  //     iceServers: this.#iceServers,
  //     iceAdditionalHostAddresses: this.#additionalHostAddresses,
  //     iceTransportPolicy: 'all',
  //   })

  //   pc.addEventListener('connectionstatechange', () => {
  //     switch (pc.connectionState) {
  //       case 'new':
  //       case 'connecting':
  //         this.logger.info('WebRTC Peer connection state: connecting')
  //         break
  //       case 'connected':
  //         this.logger.info('WebRTC Peer connection state: connected')
  //         break
  //       case 'disconnected':
  //       case 'closed':
  //       case 'failed':
  //         this.logger.warning('WebRTC Peer connection state: disconnected')
  //         break
  //       default:
  //         this.logger.warning('WebRTC Peer connection state: unknown')
  //         break
  //     }
  //   })

  //   const peerConnectedAbortController = new AbortController()

  //   const peerConnected = new Promise<void>((resolve, reject) => {
  //     const onConnectionStateChange = () => {
  //       switch (pc.connectionState) {
  //         case 'connected':
  //           pc.removeEventListener('connectionstatechange', onConnectionStateChange)
  //           return resolve(void 0)
  //         case 'disconnected':
  //         case 'closed':
  //         case 'failed':
  //           pc.removeEventListener('connectionstatechange', onConnectionStateChange)
  //           return reject(new Error('WebRTC Peer connection failed'))
  //         default:
  //           break
  //       }
  //     }
  //     pc.addEventListener('connectionstatechange', onConnectionStateChange)
  //     peerConnectedAbortController.signal.addEventListener('abort', () =>
  //       // reject(new Error('Aborted'))
  //       resolve(void 0)
  //     )
  //   })

  //   peerConnected.then(() => {
  //     this.logger.info('WebRTC Peer connection established')
  //   })

  //   pc.addEventListener('icecandidateerror', (event) => {
  //     const e = new IceCandidateError(
  //       event.address,
  //       event.errorCode,
  //       event.errorText,
  //       event.port,
  //       event.url
  //     )
  //     this.logger.error(e)
  //   })

  //   const videoRtpBus = new EventEmitter({
  //     captureRejections: true,
  //   })

  //   const audioRtpBus = new EventEmitter({
  //     captureRejections: true,
  //   })

  //   const rtpPromiseAbortController = new AbortController()

  //   const videoRtpSending = new Promise<void>((resolve, reject) => {
  //     videoRtpBus.once('sent', () => {
  //       this.logger.info('Video Stream Started')
  //       return resolve(void 0)
  //     })
  //     videoRtpBus.once('error', (error: Error) => reject(error))
  //     rtpPromiseAbortController.signal.addEventListener('abort', () => resolve(void 0))
  //   })

  //   const audioRtpSending = new Promise<void>((resolve, reject) => {
  //     audioRtpBus.once('sent', () => {
  //       this.logger.info('Audio Stream Started')
  //       resolve(void 0)
  //     })
  //     audioRtpBus.once('error', (error: Error) => reject(error))
  //     rtpPromiseAbortController.signal.addEventListener('abort', () => resolve(void 0))
  //   })

  //   pc.addEventListener('track', (event: RTCTrackEvent) => {
  //     const { unSubscribe } = event.track.onReceiveRtp.subscribe((rtp) => {
  //       switch (event.track.kind) {
  //         case 'video':
  //           udp.send(rtp.serialize(), videoPort, '0.0.0.0', (error, _bytes) => {
  //             if (error) {
  //               this.logger.error(error)
  //               return
  //             }
  //             // this.logger.debug(`Sent ${bytes} bytes of video data to 0.0.0.0:${videoPort}`)
  //             videoRtpBus.emit('sent')
  //           })
  //           break

  //         case 'audio':
  //           udp.send(rtp.serialize(), audioPort, '0.0.0.0', (error, _bytes) => {
  //             if (error) {
  //               this.logger.error(error)
  //               return
  //             }
  //             // this.logger.debug(`Sent ${bytes} bytes of audio data to 0.0.0.0:${audioPort}`)
  //             audioRtpBus.emit('sent')
  //           })
  //           break

  //         default:
  //           break
  //       }
  //     })
  //     rtpPromiseAbortController.signal.addEventListener('abort', () => unSubscribe())
  //   })

  //   try {
  //     pc.addTransceiver('audio', { direction: 'recvonly' })
  //   } catch (error) {
  //     throw new Error(`Failed to add audio transceiver: ${error.message}`)
  //   }

  //   try {
  //     pc.addTransceiver('video', { direction: 'recvonly' })
  //   } catch (error) {
  //     throw new Error(`Failed to add video transceiver: ${error.message}`)
  //   }

  //   // Add a data channel to include the application m line in SDP
  //   pc.createDataChannel('dataSendChannel', { id: 1 })

  //   const offer = await pc.createOffer()
  //   await pc.setLocalDescription(offer)

  //   const {
  //     data: { results },
  //   } = await service.enterprises.devices.executeCommand({
  //     name: camera.uid,
  //     requestBody: {
  //       command: 'sdm.devices.commands.CameraLiveStream.GenerateWebRtcStream',
  //       params: {
  //         offerSdp: offer.sdp,
  //       },
  //     },
  //   })

  //   if (!results!.answerSdp) {
  //     throw new Error('WebRTC Answer SDP not found')
  //   }
  //   if (!results!.mediaSessionId) {
  //     throw new Error('Media Session ID not found')
  //   }

  //   camera.streamExtensionToken = results!.mediaSessionId
  //   camera.expiresAt = DateTime.utc().plus({ minutes: 5 })
  //   if (results!.expiresAt) {
  //     const expiresAt = DateTime.fromISO(results!.expiresAt)
  //     if (expiresAt.isValid) {
  //       camera.expiresAt = expiresAt
  //     }
  //   }
  //   await camera.save()

  //   await pc.setRemoteDescription({
  //     type: 'answer',
  //     sdp: results!.answerSdp,
  //   })

  //   await Promise.all([videoRtpSending, audioRtpSending])

  //   this.logger.info('Starting GStreamer process for WebRTC stream')

  //   const gstreamerArgs: string[] = [
  //     '-q', // Quiet mode
  //     `--gst-debug-level=${env.get('GSTREAMER_DEBUG_LEVEL', '2')}`, // Log level set to WARNING
  //     // Audio pipeline
  //     'udpsrc',
  //     `port=${audioPort}`,
  //     'caps="application/x-rtp,media=(string)audio,clock-rate=(int)48000,encoding-name=(string)OPUS,payload=(int)96"',
  //     '!',
  //     'rtpjitterbuffer',
  //     'latency=200', // Increased jitter buffer latency
  //     '!',
  //     'rtpopusdepay',
  //     '!',
  //     'opusdec', // Decode Opus to raw audio
  //     '!',
  //     'audioconvert', // Convert raw audio format if needed
  //     '!',
  //     'avenc_aac', // Encode to AAC (or 'faac' if available)
  //     '!',
  //     'queue',
  //     'max-size-buffers=0',
  //     'max-size-time=0',
  //     'max-size-bytes=0',
  //     'leaky=downstream',
  //     '!',
  //     'rtspclientsink',
  //     'name=s',
  //     `location="${this.#location}"`,
  //     'async-handling=true',
  //     'protocols=udp', // Use UDP for the RTSP feed

  //     // Video pipeline
  //     'udpsrc',
  //     `port=${videoPort}`,
  //     'caps="application/x-rtp,media=(string)video,clock-rate=(int)90000,encoding-name=(string)H264,payload=(int)97"',
  //     '!',
  //     'rtpjitterbuffer',
  //     'latency=200', // Increased jitter buffer latency
  //     '!',
  //     'rtph264depay',
  //     '!',
  //     'h264parse',
  //     'config-interval=-1', // Preserve the SPS/PPS information
  //     '!',
  //     'queue',
  //     'max-size-buffers=0',
  //     'max-size-time=0',
  //     'max-size-bytes=0',
  //     'leaky=downstream',
  //     '!',
  //     's.sink_1',
  //   ]

  //   this.#streamer = execa(gstreamerBinary, gstreamerArgs, {
  //     stdio: 'pipe',
  //     reject: false,
  //     shell: true,
  //     signal: this.#abortController.signal,
  //   })

  //   this.#streamer.stdout!.on('data', (data) => {
  //     this.logger.info(data.toString())
  //   })

  //   this.#streamer.stderr!.on('data', (data) => {
  //     this.logger.warning(data.toString())
  //   })

  //   this.#streamer.on('exit', async (code) => {
  //     if (code === 1) {
  //       const result = await this.#streamer
  //       this.logger.error(`${result!.escapedCommand} failed with code ${result!.exitCode}`)
  //     } else {
  //       this.logger.info(`GStreamer exited with code ${code}`)
  //     }
  //     process.exit(code ? code : 0)
  //   })
  // }

  #gracefulExit(code: number = 0) {
    if (this.#streamer) {
      this.#streamer.kill('SIGKILL')
    }
    if (this.#socket) {
      this.#socket.close()
    }
    execa('rm', [this.#streamerPassthroughSock])
      .catch(() => {})
      .finally(() => {
        process.exit(code)
      })
  }
}
