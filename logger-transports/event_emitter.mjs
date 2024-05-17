import build from 'pino-abstract-transport'
import net from 'node:net'

export default async function (opts) {
  const { destination: port } = opts
  const client = new net.Socket()
  const connect = async () => {
    try {
      await new Promise((resolve, reject) => {
        client.once('error', reject)
        client.connect(port, '127.0.0.1', () => {
          resolve()
        })
      })
      return true
    } catch (err) {
      return false
    }
  }
  const preConnectionCache = []
  const onConnected = () => {
    while (preConnectionCache.length) {
      client.write(JSON.stringify(preConnectionCache.shift()))
    }
  }
  let connected = await connect()
  let connecting = false
  const connectInterval = setInterval(async () => {
    if (connected) {
      onConnected()
      clearInterval(connectInterval)
      return
    }
    if (connecting) {
      return
    }
    connecting = true
    connected = await connect()
    connecting = false
    if (connected) {
      onConnected()
      clearInterval(connectInterval)
      return
    }
  }, 100)
  return build(
    async function (source) {
      for await (let obj of source) {
        if (connected) {
          client.write(JSON.stringify(obj))
        } else {
          preConnectionCache.push(obj)
        }
      }
    },
    {
      async close() {
        client.destroy()
      },
    }
  )
}
