import env from '#start/env'
import { createServer } from 'node:net'
import logEmitter from '#services/emitter.log'
import type { Socket } from 'node:net'

const pinoPort = env.get('PINO_PORT', 62000)

const logServer = createServer({ keepAlive: true }, (socket: Socket) => {
  socket.on('data', (data) => {
    const json = data.toString()
    try {
      const obj = JSON.parse(json)
      logEmitter.emit('log', obj)
    } catch {}
  })
})

logServer.listen(pinoPort, '0.0.0.0')

export default logServer
