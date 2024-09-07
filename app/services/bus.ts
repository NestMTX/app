import { EventEmitter } from 'node:events'
import type { ApplicationService } from '@adonisjs/core/types'

export class BusService extends EventEmitter {
  readonly #app: ApplicationService
  constructor(app: ApplicationService) {
    super({
      captureRejections: true,
    })
    this.#app = app
  }

  async publish(domain: string, event: string, entity: any | null | undefined, details: unknown) {
    const promises: Promise<void>[] = []
    if (this.#app.socketIoService) {
      promises.push(this.#app.socketIoService.publish(domain, event, entity, details))
    }
    if (this.#app.mqttService) {
      promises.push(this.#app.mqttService.publish(domain, event, entity, details))
    }
    await Promise.all(promises)
  }
}
