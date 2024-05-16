import { destination } from '@adonisjs/core/logger'
import build from 'pino-abstract-transport'
import { once } from 'node:events'
import { existsSync } from 'node:fs'

const awaitFifo = async (path) => {
  if ('string' !== typeof path) {
    return
  }
  let exists = existsSync(path)
  while (!exists) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    exists = existsSync(path)
  }
  return
}

export default async function (opts) {
  const { destination: dst } = opts
  await awaitFifo(dst)
  const dest = destination({ dest: dst || 1, sync: false })
  await once(dest, 'ready')
  return build(
    async function (source) {
      for await (let obj of source) {
        const toDrain = !dest.write(obj.msg.toUpperCase() + '\n')
        if (toDrain) {
          await once(dest, 'drain')
        }
      }
    },
    {
      async close() {
        dest.end()
        await once(dest, 'close')
      },
    }
  )
}
