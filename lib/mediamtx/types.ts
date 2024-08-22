import type {
  OpenAPIClient,
  Parameters,
  UnknownParamsObject,
  OperationResponse,
  AxiosRequestConfig,
} from 'openapi-client-axios'

declare namespace Components {
  namespace Schemas {
    export interface AuthInternalUser {
      user?: string
      pass?: string
      ips?: string[]
      permissions?: AuthInternalUserPermission[]
    }
    export interface AuthInternalUserPermission {
      action?: string
      path?: string
    }
    export interface Error {
      error?: string
    }
    export interface GlobalConf {
      logLevel?: string
      logDestinations?: string[]
      logFile?: string
      readTimeout?: string
      writeTimeout?: string
      writeQueueSize?: number
      udpMaxPayloadSize?: number
      runOnConnect?: string
      runOnConnectRestart?: boolean
      runOnDisconnect?: string
      authMethod?: string
      authInternalUsers?: AuthInternalUser[]
      authHTTPAddress?: string
      authHTTPExclude?: AuthInternalUserPermission[]
      authJWTJWKS?: string
      api?: boolean
      apiAddress?: string
      apiEncryption?: boolean
      apiServerKey?: string
      apiServerCert?: string
      apiAllowOrigin?: string
      apiTrustedProxies?: string[]
      metrics?: boolean
      metricsAddress?: string
      metricsEncryption?: boolean
      metricsServerKey?: string
      metricsServerCert?: string
      metricsAllowOrigin?: string
      metricsTrustedProxies?: string[]
      pprof?: boolean
      pprofAddress?: string
      pprofEncryption?: boolean
      pprofServerKey?: string
      pprofServerCert?: string
      pprofAllowOrigin?: string
      pprofTrustedProxies?: string[]
      playback?: boolean
      playbackAddress?: string
      playbackEncryption?: boolean
      playbackServerKey?: string
      playbackServerCert?: string
      playbackAllowOrigin?: string
      playbackTrustedProxies?: string[]
      rtsp?: boolean
      protocols?: string[]
      encryption?: string
      rtspAddress?: string
      rtspsAddress?: string
      rtpAddress?: string
      rtcpAddress?: string
      multicastIPRange?: string
      multicastRTPPort?: number
      multicastRTCPPort?: number
      serverKey?: string
      serverCert?: string
      rtspAuthMethods?: string[]
      rtmp?: boolean
      rtmpAddress?: string
      rtmpEncryption?: string
      rtmpsAddress?: string
      rtmpServerKey?: string
      rtmpServerCert?: string
      hls?: boolean
      hlsAddress?: string
      hlsEncryption?: boolean
      hlsServerKey?: string
      hlsServerCert?: string
      hlsAllowOrigin?: string
      hlsTrustedProxies?: string[]
      hlsAlwaysRemux?: boolean
      hlsVariant?: string
      hlsSegmentCount?: number
      hlsSegmentDuration?: string
      hlsPartDuration?: string
      hlsSegmentMaxSize?: string
      hlsDirectory?: string
      hlsMuxerCloseAfter?: string
      webrtc?: boolean
      webrtcAddress?: string
      webrtcEncryption?: boolean
      webrtcServerKey?: string
      webrtcServerCert?: string
      webrtcAllowOrigin?: string
      webrtcTrustedProxies?: string[]
      webrtcLocalUDPAddress?: string
      webrtcLocalTCPAddress?: string
      webrtcIPsFromInterfaces?: boolean
      webrtcIPsFromInterfacesList?: string[]
      webrtcAdditionalHosts?: string[]
      webrtcICEServers2?: {
        url?: string
        username?: string
        password?: string
        clientOnly?: boolean
      }[]
      webrtcHandshakeTimeout?: string
      webrtcTrackGatherTimeout?: string
      srt?: boolean
      srtAddress?: string
    }
    export interface HLSMuxer {
      path?: string
      created?: string
      lastRequest?: string
      bytesSent?: number // int64
    }
    export interface HLSMuxerList {
      pageCount?: number
      itemCount?: number
      items?: HLSMuxer[]
    }
    export interface Path {
      name?: string
      confName?: string
      source?: PathSource
      ready?: boolean
      readyTime?: string | null
      tracks?: string[]
      bytesReceived?: number // int64
      bytesSent?: number // int64
      readers?: PathReader[]
    }
    export interface PathConf {
      name?: string
      source?: string
      sourceFingerprint?: string
      sourceOnDemand?: boolean
      sourceOnDemandStartTimeout?: string
      sourceOnDemandCloseAfter?: string
      maxReaders?: number
      srtReadPassphrase?: string
      fallback?: string
      record?: boolean
      recordPath?: string
      recordFormat?: string
      recordPartDuration?: string
      recordSegmentDuration?: string
      recordDeleteAfter?: string
      overridePublisher?: boolean
      srtPublishPassphrase?: string
      rtspTransport?: string
      rtspAnyPort?: boolean
      rtspRangeType?: string
      rtspRangeStart?: string
      sourceRedirect?: string
      rpiCameraCamID?: number
      rpiCameraWidth?: number
      rpiCameraHeight?: number
      rpiCameraHFlip?: boolean
      rpiCameraVFlip?: boolean
      rpiCameraBrightness?: number
      rpiCameraContrast?: number
      rpiCameraSaturation?: number
      rpiCameraSharpness?: number
      rpiCameraExposure?: string
      rpiCameraAWB?: string
      rpiCameraAWBGains?: [number, number]
      rpiCameraDenoise?: string
      rpiCameraShutter?: number
      rpiCameraMetering?: string
      rpiCameraGain?: number
      rpiCameraEV?: number
      rpiCameraROI?: string
      rpiCameraHDR?: boolean
      rpiCameraTuningFile?: string
      rpiCameraMode?: string
      rpiCameraFPS?: number
      rpiCameraIDRPeriod?: number
      rpiCameraBitrate?: number
      rpiCameraProfile?: string
      rpiCameraLevel?: string
      rpiCameraAfMode?: string
      rpiCameraAfRange?: string
      rpiCameraAfSpeed?: string
      rpiCameraLensPosition?: number
      rpiCameraAfWindow?: string
      rpiCameraTextOverlayEnable?: boolean
      rpiCameraTextOverlay?: string
      runOnInit?: string
      runOnInitRestart?: boolean
      runOnDemand?: string
      runOnDemandRestart?: boolean
      runOnDemandStartTimeout?: string
      runOnDemandCloseAfter?: string
      runOnUnDemand?: string
      runOnReady?: string
      runOnReadyRestart?: boolean
      runOnNotReady?: string
      runOnRead?: string
      runOnReadRestart?: boolean
      runOnUnread?: string
      runOnRecordSegmentCreate?: string
      runOnRecordSegmentComplete?: string
    }
    export interface PathConfList {
      pageCount?: number
      itemCount?: number
      items?: PathConf[]
    }
    export interface PathList {
      pageCount?: number
      itemCount?: number
      items?: Path[]
    }
    export interface PathReader {
      type?: 'hlsMuxer' | 'rtmpConn' | 'rtspSession' | 'rtspsSession' | 'srtConn' | 'webRTCSession'
      id?: string
    }
    export interface PathSource {
      type?:
        | 'hlsSource'
        | 'redirect'
        | 'rpiCameraSource'
        | 'rtmpConn'
        | 'rtmpSource'
        | 'rtspSession'
        | 'rtspSource'
        | 'rtspsSession'
        | 'srtConn'
        | 'srtSource'
        | 'udpSource'
        | 'webRTCSession'
        | 'webRTCSource'
      id?: string
    }
    export interface RTMPConn {
      id?: string
      created?: string
      remoteAddr?: string
      state?: 'idle' | 'read' | 'publish'
      path?: string
      query?: string
      bytesReceived?: number // int64
      bytesSent?: number // int64
    }
    export interface RTMPConnList {
      pageCount?: number
      itemCount?: number
      items?: RTMPConn[]
    }
    export interface RTSPConn {
      id?: string
      created?: string
      remoteAddr?: string
      bytesReceived?: number // int64
      bytesSent?: number // int64
    }
    export interface RTSPConnList {
      pageCount?: number
      itemCount?: number
      items?: RTSPConn[]
    }
    export interface RTSPSession {
      id?: string
      created?: string
      remoteAddr?: string
      state?: 'idle' | 'read' | 'publish'
      path?: string
      query?: string
      transport?: string | null
      bytesReceived?: number // int64
      bytesSent?: number // int64
    }
    export interface RTSPSessionList {
      pageCount?: number
      itemCount?: number
      items?: RTSPSession[]
    }
    export interface Recording {
      name?: string
      segments?: RecordingSegment[]
    }
    export interface RecordingList {
      pageCount?: number
      itemCount?: number
      items?: Recording[]
    }
    export interface RecordingSegment {
      start?: string
    }
    export interface SRTConn {
      id?: string
      created?: string
      remoteAddr?: string
      state?: 'idle' | 'read' | 'publish'
      path?: string
      query?: string
      /**
       * The total number of sent DATA packets, including retransmitted packets
       */
      packetsSent?: number // int64
      /**
       * The total number of received DATA packets, including retransmitted packets
       */
      packetsReceived?: number // int64
      packetsReceivedBelated?: number // int64
      /**
       * The total number of unique DATA packets sent by the SRT sender
       */
      packetsSentUnique?: number // int64
      /**
       * The total number of unique original, retransmitted or recovered by the packet filter DATA packets received in time, decrypted without errors and, as a result, scheduled for delivery to the upstream application by the SRT receiver.
       */
      packetsReceivedUnique?: number // int64
      /**
       * The total number of data packets considered or reported as lost at the sender side. Does not correspond to the packets detected as lost at the receiver side.
       */
      packetsSendLoss?: number // int64
      /**
       * The total number of SRT DATA packets detected as presently missing (either reordered or lost) at the receiver side
       */
      packetsReceivedLoss?: number // int64
      /**
       * The total number of retransmitted packets sent by the SRT sender
       */
      packetsRetrans?: number // int64
      /**
       * The total number of retransmitted packets registered at the receiver side
       */
      packetsReceivedRetrans?: number // int64
      /**
       * The total number of sent ACK (Acknowledgement) control packets
       */
      packetsSentACK?: number // int64
      /**
       * The total number of received ACK (Acknowledgement) control packets
       */
      packetsReceivedACK?: number // int64
      /**
       * The total number of sent NAK (Negative Acknowledgement) control packets
       */
      packetsSentNAK?: number // int64
      /**
       * The total number of received NAK (Negative Acknowledgement) control packets
       */
      packetsReceivedNAK?: number // int64
      /**
       * The total number of sent KM (Key Material) control packets
       */
      packetsSentKM?: number // int64
      /**
       * The total number of received KM (Key Material) control packets
       */
      packetsReceivedKM?: number // int64
      /**
       * The total accumulated time in microseconds, during which the SRT sender has some data to transmit, including packets that have been sent, but not yet acknowledged
       */
      usSndDuration?: number // int64
      /**
       * The total number of dropped by the SRT sender DATA packets that have no chance to be delivered in time
       */
      packetsSendDrop?: number // int64
      /**
       * The total number of dropped by the SRT receiver and, as a result, not delivered to the upstream application DATA packets
       */
      packetsReceivedDrop?: number // int64
      /**
       * The total number of packets that failed to be decrypted at the receiver side
       */
      packetsReceivedUndecrypt?: number // int64
      /**
       * Same as packetsSent, but expressed in bytes, including payload and all the headers (IP, TCP, SRT)
       */
      bytesSent?: number // int64
      /**
       * Same as packetsReceived, but expressed in bytes, including payload and all the headers (IP, TCP, SRT)
       */
      bytesReceived?: number // int64
      bytesReceivedBelated?: number // int64
      /**
       * Same as packetsSentUnique, but expressed in bytes, including payload and all the headers (IP, TCP, SRT)
       */
      bytesSentUnique?: number // int64
      /**
       * Same as packetsReceivedUnique, but expressed in bytes, including payload and all the headers (IP, TCP, SRT)
       */
      bytesReceivedUnique?: number // int64
      /**
       * Same as packetsReceivedLoss, but expressed in bytes, including payload and all the headers (IP, TCP, SRT), bytes for the presently missing (either reordered or lost) packets' payloads are estimated based on the average packet size
       */
      bytesReceivedLoss?: number // int64
      /**
       * Same as packetsRetrans, but expressed in bytes, including payload and all the headers (IP, TCP, SRT)
       */
      bytesRetrans?: number // int64
      /**
       * Same as packetsReceivedRetrans, but expressed in bytes, including payload and all the headers (IP, TCP, SRT)
       */
      bytesReceivedRetrans?: number // int64
      /**
       * Same as packetsSendDrop, but expressed in bytes, including payload and all the headers (IP, TCP, SRT)
       */
      bytesSendDrop?: number // int64
      /**
       * Same as packetsReceivedDrop, but expressed in bytes, including payload and all the headers (IP, TCP, SRT)
       */
      bytesReceivedDrop?: number // int64
      /**
       * Same as packetsReceivedUndecrypt, but expressed in bytes, including payload and all the headers (IP, TCP, SRT)
       */
      bytesReceivedUndecrypt?: number // int64
      /**
       * Current minimum time interval between which consecutive packets are sent, in microseconds
       */
      usPacketsSendPeriod?: number // float64
      /**
       * The maximum number of packets that can be "in flight"
       */
      packetsFlowWindow?: number // int64
      /**
       * The number of packets in flight
       */
      packetsFlightSize?: number // int64
      /**
       * Smoothed round-trip time (SRTT), an exponentially-weighted moving average (EWMA) of an endpoint's RTT samples, in milliseconds
       */
      msRTT?: number // float64
      /**
       * Current transmission bandwidth, in Mbps
       */
      mbpsSendRate?: number // float64
      /**
       * Current receiving bandwidth, in Mbps
       */
      mbpsReceiveRate?: number // float64
      /**
       * Estimated capacity of the network link, in Mbps
       */
      mbpsLinkCapacity?: number // float64
      /**
       * The available space in the sender's buffer, in bytes
       */
      bytesAvailSendBuf?: number // int64
      /**
       * The available space in the receiver's buffer, in bytes
       */
      bytesAvailReceiveBuf?: number // int64
      /**
       * Transmission bandwidth limit, in Mbps
       */
      mbpsMaxBW?: number // float64
      /**
       * Maximum Segment Size (MSS), in bytes
       */
      byteMSS?: number // int64
      /**
       * The number of packets in the sender's buffer that are already scheduled for sending or even possibly sent, but not yet acknowledged
       */
      packetsSendBuf?: number // int64
      /**
       * Instantaneous (current) value of packetsSndBuf, but expressed in bytes, including payload and all headers (IP, TCP, SRT)
       */
      bytesSendBuf?: number // int64
      /**
       * The timespan (msec) of packets in the sender's buffer (unacknowledged packets)
       */
      msSendBuf?: number // int64
      /**
       * Timestamp-based Packet Delivery Delay value of the peer
       */
      msSendTsbPdDelay?: number // int64
      /**
       * The number of acknowledged packets in receiver's buffer
       */
      packetsReceiveBuf?: number // int64
      /**
       * Instantaneous (current) value of packetsRcvBuf, expressed in bytes, including payload and all headers (IP, TCP, SRT)
       */
      bytesReceiveBuf?: number // int64
      /**
       * The timespan (msec) of acknowledged packets in the receiver's buffer
       */
      msReceiveBuf?: number // int64
      /**
       * Timestamp-based Packet Delivery Delay value set on the socket via SRTO_RCVLATENCY or SRTO_LATENCY
       */
      msReceiveTsbPdDelay?: number // int64
      /**
       * Instant value of the packet reorder tolerance
       */
      packetsReorderTolerance?: number // int64
      /**
       * Accumulated difference between the current time and the time-to-play of a packet that is received late
       */
      packetsReceivedAvgBelatedTime?: number // int64
      /**
       * Percentage of resent data vs. sent data
       */
      packetsSendLossRate?: number // float64
      /**
       * Percentage of retransmitted data vs. received data
       */
      packetsReceivedLossRate?: number // float64
    }
    export interface SRTConnList {
      pageCount?: number
      itemCount?: number
      items?: SRTConn[]
    }
    export interface WebRTCSession {
      id?: string
      created?: string
      remoteAddr?: string
      peerConnectionEstablished?: boolean
      localCandidate?: string
      remoteCandidate?: string
      state?: 'read' | 'publish'
      path?: string
      query?: string
      bytesReceived?: number // int64
      bytesSent?: number // int64
    }
    export interface WebRTCSessionList {
      pageCount?: number
      itemCount?: number
      items?: WebRTCSession[]
    }
  }
}
declare namespace Paths {
  namespace ConfigGlobalGet {
    namespace Responses {
      export type $200 = Components.Schemas.GlobalConf
      export type $400 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace ConfigGlobalSet {
    export type RequestBody = Components.Schemas.GlobalConf
    namespace Responses {
      export interface $200 {}
      export type $400 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace ConfigPathDefaultsGet {
    namespace Responses {
      export type $200 = Components.Schemas.PathConf
      export type $400 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace ConfigPathDefaultsPatch {
    export type RequestBody = Components.Schemas.PathConf
    namespace Responses {
      export interface $200 {}
      export type $400 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace ConfigPathsAdd {
    namespace Parameters {
      export type Name = string
    }
    export interface PathParameters {
      name: Parameters.Name
    }
    export type RequestBody = Components.Schemas.PathConf
    namespace Responses {
      export interface $200 {}
      export type $400 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace ConfigPathsDelete {
    namespace Parameters {
      export type Name = string
    }
    export interface PathParameters {
      name: Parameters.Name
    }
    namespace Responses {
      export interface $200 {}
      export type $400 = Components.Schemas.Error
      export type $404 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace ConfigPathsGet {
    namespace Parameters {
      export type Name = string
    }
    export interface PathParameters {
      name: Parameters.Name
    }
    namespace Responses {
      export type $200 = Components.Schemas.PathConf
      export type $400 = Components.Schemas.Error
      export type $404 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace ConfigPathsList {
    namespace Parameters {
      export type ItemsPerPage = number
      export type Page = number
    }
    export interface QueryParameters {
      page?: Parameters.Page
      itemsPerPage?: Parameters.ItemsPerPage
    }
    namespace Responses {
      export type $200 = Components.Schemas.PathConfList
      export type $400 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace ConfigPathsPatch {
    namespace Parameters {
      export type Name = string
    }
    export interface PathParameters {
      name: Parameters.Name
    }
    export type RequestBody = Components.Schemas.PathConf
    namespace Responses {
      export interface $200 {}
      export type $400 = Components.Schemas.Error
      export type $404 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace ConfigPathsReplace {
    namespace Parameters {
      export type Name = string
    }
    export interface PathParameters {
      name: Parameters.Name
    }
    export type RequestBody = Components.Schemas.PathConf
    namespace Responses {
      export interface $200 {}
      export type $400 = Components.Schemas.Error
      export type $404 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace HlsMuxersGet {
    namespace Parameters {
      export type Name = string
    }
    export interface PathParameters {
      name: Parameters.Name
    }
    namespace Responses {
      export type $200 = Components.Schemas.HLSMuxer
      export type $400 = Components.Schemas.Error
      export type $404 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace HlsMuxersList {
    namespace Parameters {
      export type ItemsPerPage = number
      export type Page = number
    }
    export interface QueryParameters {
      page?: Parameters.Page
      itemsPerPage?: Parameters.ItemsPerPage
    }
    namespace Responses {
      export type $200 = Components.Schemas.HLSMuxerList
      export type $400 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace PathsGet {
    namespace Parameters {
      export type Name = string
    }
    export interface PathParameters {
      name: Parameters.Name
    }
    namespace Responses {
      export type $200 = Components.Schemas.Path
      export type $400 = Components.Schemas.Error
      export type $404 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace PathsList {
    namespace Parameters {
      export type ItemsPerPage = number
      export type Page = number
    }
    export interface QueryParameters {
      page?: Parameters.Page
      itemsPerPage?: Parameters.ItemsPerPage
    }
    namespace Responses {
      export type $200 = Components.Schemas.PathList
      export type $400 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace RecordingsDeleteSegment {
    namespace Parameters {
      export type Path = string
      export type Start = string
    }
    export interface QueryParameters {
      path: Parameters.Path
      start: Parameters.Start
    }
    namespace Responses {
      export interface $200 {}
      export type $400 = Components.Schemas.Error
      export type $404 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace RecordingsGet {
    namespace Parameters {
      export type Name = string
    }
    export interface PathParameters {
      name: Parameters.Name
    }
    namespace Responses {
      export type $200 = Components.Schemas.Recording
      export type $400 = Components.Schemas.Error
      export type $404 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace RecordingsList {
    namespace Parameters {
      export type ItemsPerPage = number
      export type Page = number
    }
    export interface QueryParameters {
      page?: Parameters.Page
      itemsPerPage?: Parameters.ItemsPerPage
    }
    namespace Responses {
      export type $200 = Components.Schemas.RecordingList
      export type $400 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace RtmpConnectionsGet {
    namespace Parameters {
      export type Id = string
    }
    export interface PathParameters {
      id: Parameters.Id
    }
    namespace Responses {
      export type $200 = Components.Schemas.RTMPConn
      export type $400 = Components.Schemas.Error
      export type $404 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace RtmpConnsKick {
    namespace Parameters {
      export type Id = string
    }
    export interface PathParameters {
      id: Parameters.Id
    }
    namespace Responses {
      export interface $200 {}
      export type $400 = Components.Schemas.Error
      export type $404 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace RtmpConnsList {
    namespace Parameters {
      export type ItemsPerPage = number
      export type Page = number
    }
    export interface QueryParameters {
      page?: Parameters.Page
      itemsPerPage?: Parameters.ItemsPerPage
    }
    namespace Responses {
      export type $200 = Components.Schemas.RTMPConnList
      export type $400 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace RtmpsConnectionsGet {
    namespace Parameters {
      export type Id = string
    }
    export interface PathParameters {
      id: Parameters.Id
    }
    namespace Responses {
      export type $200 = Components.Schemas.RTMPConn
      export type $400 = Components.Schemas.Error
      export type $404 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace RtmpsConnsKick {
    namespace Parameters {
      export type Id = string
    }
    export interface PathParameters {
      id: Parameters.Id
    }
    namespace Responses {
      export interface $200 {}
      export type $400 = Components.Schemas.Error
      export type $404 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace RtmpsConnsList {
    namespace Parameters {
      export type ItemsPerPage = number
      export type Page = number
    }
    export interface QueryParameters {
      page?: Parameters.Page
      itemsPerPage?: Parameters.ItemsPerPage
    }
    namespace Responses {
      export type $200 = Components.Schemas.RTMPConnList
      export type $400 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace RtspConnsGet {
    namespace Parameters {
      export type Id = string
    }
    export interface PathParameters {
      id: Parameters.Id
    }
    namespace Responses {
      export type $200 = Components.Schemas.RTSPConn
      export type $400 = Components.Schemas.Error
      export type $404 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace RtspConnsList {
    namespace Parameters {
      export type ItemsPerPage = number
      export type Page = number
    }
    export interface QueryParameters {
      page?: Parameters.Page
      itemsPerPage?: Parameters.ItemsPerPage
    }
    namespace Responses {
      export type $200 = Components.Schemas.RTSPConnList
      export type $400 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace RtspSessionsGet {
    namespace Parameters {
      export type Id = string
    }
    export interface PathParameters {
      id: Parameters.Id
    }
    namespace Responses {
      export type $200 = Components.Schemas.RTSPSession
      export type $400 = Components.Schemas.Error
      export type $404 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace RtspSessionsKick {
    namespace Parameters {
      export type Id = string
    }
    export interface PathParameters {
      id: Parameters.Id
    }
    namespace Responses {
      export interface $200 {}
      export type $400 = Components.Schemas.Error
      export type $404 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace RtspSessionsList {
    namespace Parameters {
      export type ItemsPerPage = number
      export type Page = number
    }
    export interface QueryParameters {
      page?: Parameters.Page
      itemsPerPage?: Parameters.ItemsPerPage
    }
    namespace Responses {
      export type $200 = Components.Schemas.RTSPSessionList
      export type $400 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace RtspsConnsGet {
    namespace Parameters {
      export type Id = string
    }
    export interface PathParameters {
      id: Parameters.Id
    }
    namespace Responses {
      export type $200 = Components.Schemas.RTSPConn
      export type $400 = Components.Schemas.Error
      export type $404 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace RtspsConnsList {
    namespace Parameters {
      export type ItemsPerPage = number
      export type Page = number
    }
    export interface QueryParameters {
      page?: Parameters.Page
      itemsPerPage?: Parameters.ItemsPerPage
    }
    namespace Responses {
      export type $200 = Components.Schemas.RTSPConnList
      export type $400 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace RtspsSessionsGet {
    namespace Parameters {
      export type Id = string
    }
    export interface PathParameters {
      id: Parameters.Id
    }
    namespace Responses {
      export type $200 = Components.Schemas.RTSPSession
      export type $400 = Components.Schemas.Error
      export type $404 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace RtspsSessionsKick {
    namespace Parameters {
      export type Id = string
    }
    export interface PathParameters {
      id: Parameters.Id
    }
    namespace Responses {
      export interface $200 {}
      export type $400 = Components.Schemas.Error
      export type $404 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace RtspsSessionsList {
    namespace Parameters {
      export type ItemsPerPage = number
      export type Page = number
    }
    export interface QueryParameters {
      page?: Parameters.Page
      itemsPerPage?: Parameters.ItemsPerPage
    }
    namespace Responses {
      export type $200 = Components.Schemas.RTSPSessionList
      export type $400 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace SrtConnsGet {
    namespace Parameters {
      export type Id = string
    }
    export interface PathParameters {
      id: Parameters.Id
    }
    namespace Responses {
      export type $200 = Components.Schemas.SRTConn
      export type $400 = Components.Schemas.Error
      export type $404 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace SrtConnsKick {
    namespace Parameters {
      export type Id = string
    }
    export interface PathParameters {
      id: Parameters.Id
    }
    namespace Responses {
      export interface $200 {}
      export type $400 = Components.Schemas.Error
      export type $404 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace SrtConnsList {
    namespace Parameters {
      export type ItemsPerPage = number
      export type Page = number
    }
    export interface QueryParameters {
      page?: Parameters.Page
      itemsPerPage?: Parameters.ItemsPerPage
    }
    namespace Responses {
      export type $200 = Components.Schemas.SRTConnList
      export type $400 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace WebrtcSessionsGet {
    namespace Parameters {
      export type Id = string
    }
    export interface PathParameters {
      id: Parameters.Id
    }
    namespace Responses {
      export type $200 = Components.Schemas.WebRTCSession
      export type $400 = Components.Schemas.Error
      export type $404 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace WebrtcSessionsKick {
    namespace Parameters {
      export type Id = string
    }
    export interface PathParameters {
      id: Parameters.Id
    }
    namespace Responses {
      export interface $200 {}
      export type $400 = Components.Schemas.Error
      export type $404 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
  namespace WebrtcSessionsList {
    namespace Parameters {
      export type ItemsPerPage = number
      export type Page = number
    }
    export interface QueryParameters {
      page?: Parameters.Page
      itemsPerPage?: Parameters.ItemsPerPage
    }
    namespace Responses {
      export type $200 = Components.Schemas.WebRTCSessionList
      export type $400 = Components.Schemas.Error
      export type $500 = Components.Schemas.Error
    }
  }
}

export interface OperationMethods {
  /**
   * configGlobalGet - returns the global configuration.
   */
  'configGlobalGet'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.ConfigGlobalGet.Responses.$200>
  /**
   * configGlobalSet - patches the global configuration.
   *
   * all fields are optional.
   */
  'configGlobalSet'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.ConfigGlobalSet.RequestBody,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.ConfigGlobalSet.Responses.$200>
  /**
   * configPathDefaultsGet - returns the default path configuration.
   */
  'configPathDefaultsGet'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.ConfigPathDefaultsGet.Responses.$200>
  /**
   * configPathDefaultsPatch - patches the default path configuration.
   *
   * all fields are optional.
   */
  'configPathDefaultsPatch'(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.ConfigPathDefaultsPatch.RequestBody,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.ConfigPathDefaultsPatch.Responses.$200>
  /**
   * configPathsList - returns all path configurations.
   */
  'configPathsList'(
    parameters?: Parameters<Paths.ConfigPathsList.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.ConfigPathsList.Responses.$200>
  /**
   * configPathsGet - returns a path configuration.
   */
  'configPathsGet'(
    parameters: Parameters<Paths.ConfigPathsGet.PathParameters>,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.ConfigPathsGet.Responses.$200>
  /**
   * configPathsAdd - adds a path configuration.
   *
   * all fields are optional.
   */
  'configPathsAdd'(
    parameters: Parameters<Paths.ConfigPathsAdd.PathParameters>,
    data?: Paths.ConfigPathsAdd.RequestBody,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.ConfigPathsAdd.Responses.$200>
  /**
   * configPathsPatch - patches a path configuration.
   *
   * all fields are optional.
   */
  'configPathsPatch'(
    parameters: Parameters<Paths.ConfigPathsPatch.PathParameters>,
    data?: Paths.ConfigPathsPatch.RequestBody,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.ConfigPathsPatch.Responses.$200>
  /**
   * configPathsReplace - replaces all values of a path configuration.
   *
   * all fields are optional.
   */
  'configPathsReplace'(
    parameters: Parameters<Paths.ConfigPathsReplace.PathParameters>,
    data?: Paths.ConfigPathsReplace.RequestBody,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.ConfigPathsReplace.Responses.$200>
  /**
   * configPathsDelete - removes a path configuration.
   */
  'configPathsDelete'(
    parameters: Parameters<Paths.ConfigPathsDelete.PathParameters>,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.ConfigPathsDelete.Responses.$200>
  /**
   * hlsMuxersList - returns all HLS muxers.
   */
  'hlsMuxersList'(
    parameters?: Parameters<Paths.HlsMuxersList.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.HlsMuxersList.Responses.$200>
  /**
   * hlsMuxersGet - returns a HLS muxer.
   */
  'hlsMuxersGet'(
    parameters: Parameters<Paths.HlsMuxersGet.PathParameters>,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.HlsMuxersGet.Responses.$200>
  /**
   * pathsList - returns all paths.
   */
  'pathsList'(
    parameters?: Parameters<Paths.PathsList.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.PathsList.Responses.$200>
  /**
   * pathsGet - returns a path.
   */
  'pathsGet'(
    parameters: Parameters<Paths.PathsGet.PathParameters>,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.PathsGet.Responses.$200>
  /**
   * rtspConnsList - returns all RTSP connections.
   */
  'rtspConnsList'(
    parameters?: Parameters<Paths.RtspConnsList.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.RtspConnsList.Responses.$200>
  /**
   * rtspConnsGet - returns a RTSP connection.
   */
  'rtspConnsGet'(
    parameters: Parameters<Paths.RtspConnsGet.PathParameters>,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.RtspConnsGet.Responses.$200>
  /**
   * rtspSessionsList - returns all RTSP sessions.
   */
  'rtspSessionsList'(
    parameters?: Parameters<Paths.RtspSessionsList.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.RtspSessionsList.Responses.$200>
  /**
   * rtspSessionsGet - returns a RTSP session.
   */
  'rtspSessionsGet'(
    parameters: Parameters<Paths.RtspSessionsGet.PathParameters>,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.RtspSessionsGet.Responses.$200>
  /**
   * rtspSessionsKick - kicks out a RTSP session from the server.
   */
  'rtspSessionsKick'(
    parameters: Parameters<Paths.RtspSessionsKick.PathParameters>,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.RtspSessionsKick.Responses.$200>
  /**
   * rtspsConnsList - returns all RTSPS connections.
   */
  'rtspsConnsList'(
    parameters?: Parameters<Paths.RtspsConnsList.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.RtspsConnsList.Responses.$200>
  /**
   * rtspsConnsGet - returns a RTSPS connection.
   */
  'rtspsConnsGet'(
    parameters: Parameters<Paths.RtspsConnsGet.PathParameters>,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.RtspsConnsGet.Responses.$200>
  /**
   * rtspsSessionsList - returns all RTSPS sessions.
   */
  'rtspsSessionsList'(
    parameters?: Parameters<Paths.RtspsSessionsList.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.RtspsSessionsList.Responses.$200>
  /**
   * rtspsSessionsGet - returns a RTSPS session.
   */
  'rtspsSessionsGet'(
    parameters: Parameters<Paths.RtspsSessionsGet.PathParameters>,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.RtspsSessionsGet.Responses.$200>
  /**
   * rtspsSessionsKick - kicks out a RTSPS session from the server.
   */
  'rtspsSessionsKick'(
    parameters: Parameters<Paths.RtspsSessionsKick.PathParameters>,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.RtspsSessionsKick.Responses.$200>
  /**
   * rtmpConnsList - returns all RTMP connections.
   */
  'rtmpConnsList'(
    parameters?: Parameters<Paths.RtmpConnsList.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.RtmpConnsList.Responses.$200>
  /**
   * rtmpConnectionsGet - returns a RTMP connection.
   */
  'rtmpConnectionsGet'(
    parameters: Parameters<Paths.RtmpConnectionsGet.PathParameters>,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.RtmpConnectionsGet.Responses.$200>
  /**
   * rtmpConnsKick - kicks out a RTMP connection from the server.
   */
  'rtmpConnsKick'(
    parameters: Parameters<Paths.RtmpConnsKick.PathParameters>,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.RtmpConnsKick.Responses.$200>
  /**
   * rtmpsConnsList - returns all RTMPS connections.
   */
  'rtmpsConnsList'(
    parameters?: Parameters<Paths.RtmpsConnsList.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.RtmpsConnsList.Responses.$200>
  /**
   * rtmpsConnectionsGet - returns a RTMPS connection.
   */
  'rtmpsConnectionsGet'(
    parameters: Parameters<Paths.RtmpsConnectionsGet.PathParameters>,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.RtmpsConnectionsGet.Responses.$200>
  /**
   * rtmpsConnsKick - kicks out a RTMPS connection from the server.
   */
  'rtmpsConnsKick'(
    parameters: Parameters<Paths.RtmpsConnsKick.PathParameters>,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.RtmpsConnsKick.Responses.$200>
  /**
   * srtConnsList - returns all SRT connections.
   */
  'srtConnsList'(
    parameters?: Parameters<Paths.SrtConnsList.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.SrtConnsList.Responses.$200>
  /**
   * srtConnsGet - returns a SRT connection.
   */
  'srtConnsGet'(
    parameters: Parameters<Paths.SrtConnsGet.PathParameters>,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.SrtConnsGet.Responses.$200>
  /**
   * srtConnsKick - kicks out a SRT connection from the server.
   */
  'srtConnsKick'(
    parameters: Parameters<Paths.SrtConnsKick.PathParameters>,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.SrtConnsKick.Responses.$200>
  /**
   * webrtcSessionsList - returns all WebRTC sessions.
   */
  'webrtcSessionsList'(
    parameters?: Parameters<Paths.WebrtcSessionsList.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.WebrtcSessionsList.Responses.$200>
  /**
   * webrtcSessionsGet - returns a WebRTC session.
   */
  'webrtcSessionsGet'(
    parameters: Parameters<Paths.WebrtcSessionsGet.PathParameters>,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.WebrtcSessionsGet.Responses.$200>
  /**
   * webrtcSessionsKick - kicks out a WebRTC session from the server.
   */
  'webrtcSessionsKick'(
    parameters: Parameters<Paths.WebrtcSessionsKick.PathParameters>,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.WebrtcSessionsKick.Responses.$200>
  /**
   * recordingsList - returns all recordings.
   */
  'recordingsList'(
    parameters?: Parameters<Paths.RecordingsList.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.RecordingsList.Responses.$200>
  /**
   * recordingsGet - returns recordings for a path.
   */
  'recordingsGet'(
    parameters: Parameters<Paths.RecordingsGet.PathParameters>,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.RecordingsGet.Responses.$200>
  /**
   * recordingsDeleteSegment - deletes a recording segment.
   */
  'recordingsDeleteSegment'(
    parameters?: Parameters<Paths.RecordingsDeleteSegment.QueryParameters> | null,
    data?: any,
    config?: AxiosRequestConfig
  ): OperationResponse<Paths.RecordingsDeleteSegment.Responses.$200>
}

export interface PathsDictionary {
  ['/v3/config/global/get']: {
    /**
     * configGlobalGet - returns the global configuration.
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.ConfigGlobalGet.Responses.$200>
  }
  ['/v3/config/global/patch']: {
    /**
     * configGlobalSet - patches the global configuration.
     *
     * all fields are optional.
     */
    'patch'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.ConfigGlobalSet.RequestBody,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.ConfigGlobalSet.Responses.$200>
  }
  ['/v3/config/pathdefaults/get']: {
    /**
     * configPathDefaultsGet - returns the default path configuration.
     */
    'get'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.ConfigPathDefaultsGet.Responses.$200>
  }
  ['/v3/config/pathdefaults/patch']: {
    /**
     * configPathDefaultsPatch - patches the default path configuration.
     *
     * all fields are optional.
     */
    'patch'(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.ConfigPathDefaultsPatch.RequestBody,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.ConfigPathDefaultsPatch.Responses.$200>
  }
  ['/v3/config/paths/list']: {
    /**
     * configPathsList - returns all path configurations.
     */
    'get'(
      parameters?: Parameters<Paths.ConfigPathsList.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.ConfigPathsList.Responses.$200>
  }
  ['/v3/config/paths/get/{name}']: {
    /**
     * configPathsGet - returns a path configuration.
     */
    'get'(
      parameters: Parameters<Paths.ConfigPathsGet.PathParameters>,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.ConfigPathsGet.Responses.$200>
  }
  ['/v3/config/paths/add/{name}']: {
    /**
     * configPathsAdd - adds a path configuration.
     *
     * all fields are optional.
     */
    'post'(
      parameters: Parameters<Paths.ConfigPathsAdd.PathParameters>,
      data?: Paths.ConfigPathsAdd.RequestBody,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.ConfigPathsAdd.Responses.$200>
  }
  ['/v3/config/paths/patch/{name}']: {
    /**
     * configPathsPatch - patches a path configuration.
     *
     * all fields are optional.
     */
    'patch'(
      parameters: Parameters<Paths.ConfigPathsPatch.PathParameters>,
      data?: Paths.ConfigPathsPatch.RequestBody,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.ConfigPathsPatch.Responses.$200>
  }
  ['/v3/config/paths/replace/{name}']: {
    /**
     * configPathsReplace - replaces all values of a path configuration.
     *
     * all fields are optional.
     */
    'post'(
      parameters: Parameters<Paths.ConfigPathsReplace.PathParameters>,
      data?: Paths.ConfigPathsReplace.RequestBody,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.ConfigPathsReplace.Responses.$200>
  }
  ['/v3/config/paths/delete/{name}']: {
    /**
     * configPathsDelete - removes a path configuration.
     */
    'delete'(
      parameters: Parameters<Paths.ConfigPathsDelete.PathParameters>,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.ConfigPathsDelete.Responses.$200>
  }
  ['/v3/hlsmuxers/list']: {
    /**
     * hlsMuxersList - returns all HLS muxers.
     */
    'get'(
      parameters?: Parameters<Paths.HlsMuxersList.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.HlsMuxersList.Responses.$200>
  }
  ['/v3/hlsmuxers/get/{name}']: {
    /**
     * hlsMuxersGet - returns a HLS muxer.
     */
    'get'(
      parameters: Parameters<Paths.HlsMuxersGet.PathParameters>,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.HlsMuxersGet.Responses.$200>
  }
  ['/v3/paths/list']: {
    /**
     * pathsList - returns all paths.
     */
    'get'(
      parameters?: Parameters<Paths.PathsList.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.PathsList.Responses.$200>
  }
  ['/v3/paths/get/{name}']: {
    /**
     * pathsGet - returns a path.
     */
    'get'(
      parameters: Parameters<Paths.PathsGet.PathParameters>,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.PathsGet.Responses.$200>
  }
  ['/v3/rtspconns/list']: {
    /**
     * rtspConnsList - returns all RTSP connections.
     */
    'get'(
      parameters?: Parameters<Paths.RtspConnsList.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.RtspConnsList.Responses.$200>
  }
  ['/v3/rtspconns/get/{id}']: {
    /**
     * rtspConnsGet - returns a RTSP connection.
     */
    'get'(
      parameters: Parameters<Paths.RtspConnsGet.PathParameters>,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.RtspConnsGet.Responses.$200>
  }
  ['/v3/rtspsessions/list']: {
    /**
     * rtspSessionsList - returns all RTSP sessions.
     */
    'get'(
      parameters?: Parameters<Paths.RtspSessionsList.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.RtspSessionsList.Responses.$200>
  }
  ['/v3/rtspsessions/get/{id}']: {
    /**
     * rtspSessionsGet - returns a RTSP session.
     */
    'get'(
      parameters: Parameters<Paths.RtspSessionsGet.PathParameters>,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.RtspSessionsGet.Responses.$200>
  }
  ['/v3/rtspsessions/kick/{id}']: {
    /**
     * rtspSessionsKick - kicks out a RTSP session from the server.
     */
    'post'(
      parameters: Parameters<Paths.RtspSessionsKick.PathParameters>,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.RtspSessionsKick.Responses.$200>
  }
  ['/v3/rtspsconns/list']: {
    /**
     * rtspsConnsList - returns all RTSPS connections.
     */
    'get'(
      parameters?: Parameters<Paths.RtspsConnsList.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.RtspsConnsList.Responses.$200>
  }
  ['/v3/rtspsconns/get/{id}']: {
    /**
     * rtspsConnsGet - returns a RTSPS connection.
     */
    'get'(
      parameters: Parameters<Paths.RtspsConnsGet.PathParameters>,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.RtspsConnsGet.Responses.$200>
  }
  ['/v3/rtspssessions/list']: {
    /**
     * rtspsSessionsList - returns all RTSPS sessions.
     */
    'get'(
      parameters?: Parameters<Paths.RtspsSessionsList.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.RtspsSessionsList.Responses.$200>
  }
  ['/v3/rtspssessions/get/{id}']: {
    /**
     * rtspsSessionsGet - returns a RTSPS session.
     */
    'get'(
      parameters: Parameters<Paths.RtspsSessionsGet.PathParameters>,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.RtspsSessionsGet.Responses.$200>
  }
  ['/v3/rtspssessions/kick/{id}']: {
    /**
     * rtspsSessionsKick - kicks out a RTSPS session from the server.
     */
    'post'(
      parameters: Parameters<Paths.RtspsSessionsKick.PathParameters>,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.RtspsSessionsKick.Responses.$200>
  }
  ['/v3/rtmpconns/list']: {
    /**
     * rtmpConnsList - returns all RTMP connections.
     */
    'get'(
      parameters?: Parameters<Paths.RtmpConnsList.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.RtmpConnsList.Responses.$200>
  }
  ['/v3/rtmpconns/get/{id}']: {
    /**
     * rtmpConnectionsGet - returns a RTMP connection.
     */
    'get'(
      parameters: Parameters<Paths.RtmpConnectionsGet.PathParameters>,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.RtmpConnectionsGet.Responses.$200>
  }
  ['/v3/rtmpconns/kick/{id}']: {
    /**
     * rtmpConnsKick - kicks out a RTMP connection from the server.
     */
    'post'(
      parameters: Parameters<Paths.RtmpConnsKick.PathParameters>,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.RtmpConnsKick.Responses.$200>
  }
  ['/v3/rtmpsconns/list']: {
    /**
     * rtmpsConnsList - returns all RTMPS connections.
     */
    'get'(
      parameters?: Parameters<Paths.RtmpsConnsList.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.RtmpsConnsList.Responses.$200>
  }
  ['/v3/rtmpsconns/get/{id}']: {
    /**
     * rtmpsConnectionsGet - returns a RTMPS connection.
     */
    'get'(
      parameters: Parameters<Paths.RtmpsConnectionsGet.PathParameters>,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.RtmpsConnectionsGet.Responses.$200>
  }
  ['/v3/rtmpsconns/kick/{id}']: {
    /**
     * rtmpsConnsKick - kicks out a RTMPS connection from the server.
     */
    'post'(
      parameters: Parameters<Paths.RtmpsConnsKick.PathParameters>,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.RtmpsConnsKick.Responses.$200>
  }
  ['/v3/srtconns/list']: {
    /**
     * srtConnsList - returns all SRT connections.
     */
    'get'(
      parameters?: Parameters<Paths.SrtConnsList.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.SrtConnsList.Responses.$200>
  }
  ['/v3/srtconns/get/{id}']: {
    /**
     * srtConnsGet - returns a SRT connection.
     */
    'get'(
      parameters: Parameters<Paths.SrtConnsGet.PathParameters>,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.SrtConnsGet.Responses.$200>
  }
  ['/v3/srtconns/kick/{id}']: {
    /**
     * srtConnsKick - kicks out a SRT connection from the server.
     */
    'post'(
      parameters: Parameters<Paths.SrtConnsKick.PathParameters>,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.SrtConnsKick.Responses.$200>
  }
  ['/v3/webrtcsessions/list']: {
    /**
     * webrtcSessionsList - returns all WebRTC sessions.
     */
    'get'(
      parameters?: Parameters<Paths.WebrtcSessionsList.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.WebrtcSessionsList.Responses.$200>
  }
  ['/v3/webrtcsessions/get/{id}']: {
    /**
     * webrtcSessionsGet - returns a WebRTC session.
     */
    'get'(
      parameters: Parameters<Paths.WebrtcSessionsGet.PathParameters>,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.WebrtcSessionsGet.Responses.$200>
  }
  ['/v3/webrtcsessions/kick/{id}']: {
    /**
     * webrtcSessionsKick - kicks out a WebRTC session from the server.
     */
    'post'(
      parameters: Parameters<Paths.WebrtcSessionsKick.PathParameters>,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.WebrtcSessionsKick.Responses.$200>
  }
  ['/v3/recordings/list']: {
    /**
     * recordingsList - returns all recordings.
     */
    'get'(
      parameters?: Parameters<Paths.RecordingsList.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.RecordingsList.Responses.$200>
  }
  ['/v3/recordings/get/{name}']: {
    /**
     * recordingsGet - returns recordings for a path.
     */
    'get'(
      parameters: Parameters<Paths.RecordingsGet.PathParameters>,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.RecordingsGet.Responses.$200>
  }
  ['/v3/recordings/deletesegment']: {
    /**
     * recordingsDeleteSegment - deletes a recording segment.
     */
    'delete'(
      parameters?: Parameters<Paths.RecordingsDeleteSegment.QueryParameters> | null,
      data?: any,
      config?: AxiosRequestConfig
    ): OperationResponse<Paths.RecordingsDeleteSegment.Responses.$200>
  }
}

export type Client = OpenAPIClient<OperationMethods, PathsDictionary>
