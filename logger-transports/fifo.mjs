import { destination } from '@adonisjs/core/logger'
import build from 'pino-abstract-transport'
import { once } from 'node:events'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import { execa } from 'execa'

const makeFifo = async (path) => {
  if ('string' !== typeof path) {
    return
  }
  if (existsSync(path)) {
    await fs.unlink(path)
  }
  await execa('mkfifo', [path])
}

export default async function (opts) {
  const { destination: dst } = opts
  await makeFifo(dst)
  const dest = destination({ dest: dst || 1, sync: false })
  await once(dest, 'ready')
  return build(
    async function (source) {
      for await (let obj of source) {
        const toDrain = !dest.write(JSON.stringify(obj) + '\n')
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
