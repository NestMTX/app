// import env from '#start/env'
import fs from 'node:fs/promises'
import { existsSync, createReadStream } from 'node:fs'
import { execa } from 'execa'
import type PM2 from 'pm2'
import type { ApplicationService } from '@adonisjs/core/types'
import type { LoggerService } from '@adonisjs/core/types'
import type { Logger } from '@adonisjs/logger'
import type { NATService } from '#services/nat'
import type { ICEService } from '#services/ice'
import type {
  ProcessDescription,
  // Proc
} from 'pm2'
import type { Readable } from 'node:stream'

/**
 * A class for managing the MediaMTX service process
 */
export class GStreamerService {
  readonly #app: ApplicationService
  readonly #stdOutLogPath: string
  readonly #stdErrLogPath: string
  #stdOutStream?: Readable
  #stdErrStream?: Readable
  #logger?: Logger

  constructor(app: ApplicationService) {
    this.#app = app
    this.#stdOutLogPath = this.#app.tmpPath('gstreamer.stdout.log')
    this.#stdErrLogPath = this.#app.tmpPath('gstreamer.stderr.log')
  }

  async boot(logger: LoggerService, nat: NATService, ice: ICEService, pm2: typeof PM2) {
    this.#logger = logger.child({ service: 'gstreamer' })
    await Promise.all([this.#makeFifo(this.#stdOutLogPath), this.#makeFifo(this.#stdErrLogPath)])
    this.#stdOutStream = createReadStream(this.#stdOutLogPath)
    this.#stdErrStream = createReadStream(this.#stdErrLogPath)
    this.#stdOutStream.on('data', (chunk) => {
      if (this.#logger) {
        chunk
          .toString()
          .split('\n')
          .filter((l: string) => l.trim().length > 0)
          .forEach((l: string) => this.#logger!.info(l))
      }
    })
    this.#stdErrStream.on('data', (chunk) => {
      if (this.#logger) {
        chunk
          .toString()
          .split('\n')
          .filter((l: string) => l.trim().length > 0)
          .forEach((l: string) => this.#logger!.error(l))
      }
    })
    this.#stdOutStream.on('error', (err) => {
      if (this.#logger) {
        this.#logger.error(err)
      }
    })
    this.#stdErrStream.on('error', (err) => {
      if (this.#logger) {
        this.#logger.error(err)
      }
    })
    const list: ProcessDescription[] = await new Promise<ProcessDescription[]>(
      (resolve, reject) => {
        pm2.list((err, processDescriptionList) => {
          if (err) {
            return reject(err)
          } else {
            return resolve(processDescriptionList)
          }
        })
      }
    )
    if (list.length > 0) {
      const existing = list.filter(
        (process) => 'string' === typeof process.name && process.name.startsWith('gstreamer')
      )
      if (existing.length > 0) {
        logger.info('Stopping existing GStreamer Processes')
        await Promise.all(
          existing.map(async (process) => {
            return new Promise<void>((resolve, reject) => {
              pm2.delete(process.name!, (err) => {
                if (err) {
                  return reject(err)
                } else {
                  return resolve()
                }
              })
            })
          })
        )
        logger.info('Stopped existing GStreamer Processes')
      }
    }
    this.#logger!.info('Starting GStreamer Processes')
    // await new Promise<Proc>((resolve, reject) => {
    //   pm2.start(
    //     {
    //       name: 'mediamtx',
    //       script: this.#binaryPath,
    //       args: [updatedConfigPath],
    //       autorestart: true,
    //       max_restarts: 5,
    //       cwd: this.#app.tmpPath(),
    //       output: this.#stdOutLogPath,
    //       error: this.#stdErrLogPath,
    //       pid: this.#app.tmpPath('mediamtx.pid'),
    //       time: false,
    //       interpreter: 'none',
    //     },
    //     (err, proc: Proc) => {
    //       if (err) {
    //         return reject(err)
    //       } else {
    //         return resolve(proc)
    //       }
    //     }
    //   )
    // })
    this.#logger!.info('Started GStreamer Processes')
  }

  async #makeFifo(path: string) {
    if (existsSync(path)) {
      await fs.unlink(path)
    }
    await execa('mkfifo', [path])
  }
}
