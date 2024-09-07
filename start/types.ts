import type { MqttClient } from 'mqtt'
import type { Server } from 'node:net'
import type { ApiService } from '#services/api'
import type { SocketIoService } from '#services/socket.io'
import type { MediaMTXService } from '#services/mediamtx'
import type { GStreamerService } from '#services/gstreamer'
import type { NATService } from '#services/nat'
import type { ICEService } from '#services/ice'
import type { IPCService } from '#services/ipc'
import type { MiliCron } from '@jakguru/milicron'
import type { PM3 } from '#services/pm3'
import type { MqttService } from '#services/mqtt'

declare module '@adonisjs/core/types' {
  interface ApplicationService {
    apiService: ApiService
    socketIoService: SocketIoService
    mqttBroker?: Server
    mqttClient?: MqttClient
    mqttService?: MqttService
    mediamtx: MediaMTXService
    gstreamer: GStreamerService
    pm3: PM3
    natService: NATService
    iceService: ICEService
    ipcService: IPCService
    cronService: MiliCron
  }
}
