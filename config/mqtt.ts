import type { IClientOptions } from 'mqtt'
import env from '#start/env'

const config: IClientOptions = {
  clientId: ['nestmtx', process.pid].join('_'),
  protocol: env.get('MQTT_PROTOCOL', 'mqtt'),
  host: env.get('MQTT_HOST', ':instance:'),
  port: env.get('MQTT_PORT', 1883),
  username: env.get('MQTT_USER'),
  password: env.get('MQTT_PASS'),
  manualConnect: true,
}

export default config
