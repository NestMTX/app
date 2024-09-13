import { BaseCommand } from '@adonisjs/core/ace'
import { connect } from 'node:net'
import { subProcessLogger as logger } from '#services/logger'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import type { Socket } from 'node:net'

export default class TestStall extends BaseCommand {
  static commandName = 'test:stall'
  static description = 'Test how camera feeds handle stalls'

  static options: CommandOptions = {}

  async run() {
    this.logger.info('Sending command via IPC')
    const payload = JSON.stringify(['test:stall', {}])
    const ipcSocketPath = this.app.makePath('resources/ipc.sock')
    let client: Socket
    try {
      await new Promise<void>((resolve, reject) => {
        client = connect(ipcSocketPath, () => {
          client.off('error', reject)
          resolve()
        })
        client.on('error', reject)
      })
    } catch (err) {
      logger.error(err)
      process.exit(1)
    }
    client!.on('error', (err) => {
      logger.error(err)
      process.exit(1)
    })
    client!.write(payload)
    await new Promise<void>((resolve) => setTimeout(resolve, 250))
    const closePromise = new Promise<void>((resolve) => {
      client!.on('close', () => resolve())
    })
    client!.end()
    await closePromise
    process.exit(0)
  }
}
