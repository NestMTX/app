import { BaseCommand, args } from '@adonisjs/core/ace'
import http from 'node:http'
import { createReqHandler } from '../lib/mjpeg-server/index.js'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class MpjegStream extends BaseCommand {
  static commandName = 'mjpeg:stream'
  static description =
    'Start an MJPEG Stream which will be used by NestMTX for the static image feeds'

  static options: CommandOptions = {
    staysAlive: true,
  }

  @args.string({ description: 'The port to serve on' })
  declare port: string

  @args.string({ description: 'The path to the jpeg file to serve' })
  declare path: string

  async run() {
    const port = Number.parseInt(this.port)
    if (port < 0 || port > 65535) {
      this.logger.error('Invalid port number')
      process.exit(1)
    }
    const exists = existsSync(this.path)
    if (!exists) {
      this.logger.error('File does not exist')
      process.exit(1)
    }
    const image = await readFile(this.path)
    http
      .createServer(async (req, res) => {
        const mjpegServer = createReqHandler(req, res)
        let finished = false
        res.on('finish', () => {
          if (!finished) {
            finished = true
            mjpegServer.close()
          }
        })
        while (!finished) {
          mjpegServer.write(image)
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      })
      .listen(port, () => {
        this.logger.info(`Streaming "${this.path}" on port ${port}`)
      })
  }
}
