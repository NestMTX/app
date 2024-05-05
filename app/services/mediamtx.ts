import env from '#start/env'
import fs from 'node:fs/promises'
import yaml from 'yaml'
import { execa } from 'execa'
import { Writable } from 'node:stream'
import type { ExecaChildProcess } from 'execa'
import type { ApplicationService } from '@adonisjs/core/types'
import type { LoggerService } from '@adonisjs/core/types'
import type { Logger } from '@adonisjs/logger'
import type { NATService } from '#services/nat'
import type { ICEService } from '#services/ice'

/**
 * A class for managing the MediaMTX service process
 */
export class MediaMTXService {
  readonly #binaryPath: string
  readonly #configPath: string
  readonly #app: ApplicationService
  #stdOutStream: Writable
  #stdErrStream: Writable
  #process?: ExecaChildProcess
  #logger?: Logger
  #failureCount = 0

  constructor(app: ApplicationService) {
    this.#app = app
    this.#binaryPath = env.get('MEDIA_MTX_PATH')!
    this.#configPath = env.get('MEDIA_MTX_CONFIG_PATH')!
    this.#stdOutStream = new Writable({
      write: (chunk, _encoding, callback) => {
        if (this.#logger) {
          this.#logger.info(chunk.toString())
        }
        callback()
      },
    })
    this.#stdErrStream = new Writable({
      write: (chunk, _encoding, callback) => {
        if (this.#logger) {
          this.#logger.error(chunk.toString())
        }
        callback()
      },
    })
  }

  async boot(logger: LoggerService, nat: NATService, ice: ICEService) {
    this.#logger = logger.child({ service: 'mediamtx' })
    const mediaMtxConfigRaw = await fs.readFile(this.#configPath, 'utf-8')
    const mediaMtxConfig = yaml.parse(mediaMtxConfigRaw)
    if (true === env.get('MEDIA_MTX_HLS_USE_DISK', false)) {
      try {
        await fs.mkdir(this.#app.tmpPath('hls'))
      } catch {}
    }
    const baseRunOnCommand = ['node', this.#app.makePath('ace.js'), 'mediamtx:on:event']
    const updated: any = {
      ...mediaMtxConfig,
      metrics: false,
      metricsEncryption: false,
      pprof: false,
      pprofEncryption: false,
      playbackEncryption: false,
      runOnConnectRestart: false,
      /**
       * Update the authInternalUsers configuration
       */
      authInternalUsers: [
        {
          user: 'any',
          pass: null,
          ips: [],
          permissions: [
            { action: 'read', path: null },
            { action: 'playback', path: null },
          ],
        },
        {
          user: 'any',
          pass: null,
          ips: ['127.0.0.1', '::1'],
          permissions: [
            { action: 'read', path: null },
            { action: 'playback', path: null },
            { action: 'publish', path: null },
            { action: 'api' },
          ],
        },
      ],
      /**
       * Update the API configuration
       */
      api: true,
      apiAddress: `${env.get('HOST')}:${env.get('MEDIA_MTX_RTSP_API_PORT', 9997)}`,
      apiTrustedProxies: ['127.0.0.1', '::1', ...nat.lanIps],
      apiEncryption: false,
      /**
       * Update the Playback configuration
       */
      playback: env.get('MEDIA_MTX_PLAYBACK_ENABLED', true) ? true : false,
      playbackAddress: `${env.get('HOST')}:${env.get('MEDIA_MTX_RTSP_PLAYBACK_PORT', 9996)}`,
      playbackTrustedProxies: ['127.0.0.1', '::1', ...nat.lanIps],
      /**
       * Update the RTSP configuration
       */
      rtsp: true === env.get('MEDIA_MTX_RTSP_ENABLED', true) ? true : false,
      encryption: 'no',
      protocols: ['tcp', 'udp'],
      rtspAddress: `${env.get('HOST')}:${env.get('MEDIA_MTX_RTSP_TCP_PORT', 8554)}`,
      rtpAddress: `${env.get('HOST')}:${env.get('MEDIA_MTX_RTSP_UDP_RTP_PORT', 8000)}`,
      rtcpAddress: `${env.get('HOST')}:${env.get('MEDIA_MTX_RTSP_UDP_RTCP_PORT', 8001)}`,
      /**
       * Update the RTMP configuration
       */
      rtmp: true === env.get('MEDIA_MTX_RTMP_ENABLED', false) ? true : false,
      rtmpAddress: `${env.get('HOST')}:${env.get('MEDIA_MTX_RTMP_PORT', 1935)}`,
      /**
       * Update the HLS configuration
       */
      hls: true === env.get('MEDIA_MTX_HLS_ENABLED', false) ? true : false,
      hlsEncryption: false,
      hlsAddress: `${env.get('HOST')}:${env.get('MEDIA_MTX_HLS_PORT', 8888)}`,
      hlsTrustedProxies: ['127.0.0.1', '::1', ...nat.lanIps],
      hlsAlwaysRemux: false,
      hlsVariant: 'mpegts',
      hlsSegmentCount: 7,
      hlsSegmentDuration: '1s',
      hlsPartDuration: '200ms',
      hlsSegmentMaxSize: '50M',
      hlsDirectory:
        true === env.get('MEDIA_MTX_HLS_USE_DISK', false) ? this.#app.tmpPath('hls') : '',
      /**
       * Update the WebRTC configuration
       */
      webrtc: true === env.get('MEDIA_MTX_WEB_RTC_ENABLED', false) ? true : false,
      webrtcAddress: `${env.get('HOST')}:${env.get('MEDIA_MTX_WEB_RTC_PORT', 8889)}`,
      webrtcEncryption: false,
      webrtcTrustedProxies: ['127.0.0.1', '::1', ...nat.lanIps],
      webrtcLocalUDPAddress: `${env.get('HOST')}:${env.get('MEDIA_MTX_WEB_RTC_UDP_PORT', 8189)}`,
      webrtcAdditionalHosts: ['127.0.0.1', '::1', ...nat.lanIps, nat.publicIp],
      webrtcICEServers2: ice.asMediaMtxIceServers,
      webrtcIPsFromInterfaces: true,
      /**
       * Update the SRT configuration
       */
      srt: true === env.get('MEDIA_MTX_SRT_ENABLED', false) ? true : false,
      srtAddress: `${env.get('HOST')}:${env.get('MEDIA_MTX_SRT_PORT', 8890)}`,
      /**
       * Update the path defaults configuration
       */
      pathDefaults: {
        // runOnInit: [...baseRunOnCommand, 'init'].join(' '),
        // runOnInitRestart: false,
        runOnDemand: [...baseRunOnCommand, 'demand'].join(' '),
        runOnDemandRestart: false,
        runOnUnDemand: [...baseRunOnCommand, 'unDemand'].join(' '),
        runOnReady: [...baseRunOnCommand, 'ready'].join(' '),
        runOnReadyRestart: false,
        runOnNotReady: [...baseRunOnCommand, 'notReady'].join(' '),
        runOnRead: [...baseRunOnCommand, 'read'].join(' '),
        runOnReadRestart: false,
        runOnUnread: [...baseRunOnCommand, 'unread'].join(' '),
        runOnRecordSegmentCreate: [...baseRunOnCommand, 'recordSegmentCreate'].join(' '),
        runOnRecordSegmentComplete: [...baseRunOnCommand, 'recordSegmentComplete'].join(' '),
      },
      /**
       * Update the path configuration
       */
      paths: {
        all_others: null,
      },
    }
    const updatedConfigPath = this.#app.tmpPath('nestmtx.yml')
    await fs.writeFile(
      updatedConfigPath,
      yaml.stringify(updated, {
        falseStr: 'false',
        trueStr: 'true',
        nullStr: '',
        strict: false,
        toStringDefaults: {
          defaultKeyType: 'PLAIN',
          defaultStringType: 'QUOTE_SINGLE',
        },
      })
    )
    this.#logger!.info('Starting MediaMTX service')
    this.#start()
  }

  #start() {
    this.#stdOutStream = new Writable({
      write: (chunk, _encoding, callback) => {
        if (this.#logger) {
          this.#logger.info(chunk.toString())
        }
        callback()
      },
    })
    this.#stdErrStream = new Writable({
      write: (chunk, _encoding, callback) => {
        if (this.#logger) {
          this.#logger.error(chunk.toString())
        }
        callback()
      },
    })
    const updatedConfigPath = this.#app.tmpPath('nestmtx.yml')
    this.#process = execa(this.#binaryPath, [updatedConfigPath], {
      reject: false,
    })
    this.#process.stdout?.pipe(this.#stdOutStream)
    this.#process.stderr?.pipe(this.#stdErrStream)
    this.#process.then((result) => {
      if (!result.isCanceled) {
        this.#failureCount++
        if (result.exitCode) {
          this.#logger!.error(
            `MediaMTX service exited with code ${result.exitCode}`,
            result.stdout,
            result.stderr
          )
        } else {
          this.#logger!.info('MediaMTX service exited unexpectedly')
        }
        if (this.#failureCount < 5) {
          this.#logger!.info('Restarting MediaMTX service')
          this.#start()
        } else {
          this.#logger!.error('MediaMTX service failed to start after 5 attempts')
          process.exit(1)
        }
      }
    })
  }
}
