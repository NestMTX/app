import type { ApplicationService } from '@adonisjs/core/types'
import { ApiServiceModule } from '#services/api'

interface HealthReport {
  [name: string]: {
    healthy: boolean | null
    meta?: Record<string, any>
  }
}

export default class HealthModule implements ApiServiceModule {
  #app: ApplicationService
  constructor(app: ApplicationService) {
    this.#app = app
  }

  get description() {
    return 'Application Health'
  }

  get insecure() {
    return true
  }

  get schemas() {
    return {}
  }

  async list() {
    const details: HealthReport = Object.assign(
      {},
      ...(await Promise.all([this.#appHealthState(), this.#setupState()]))
    )
    const noneAreUnhealthy = Object.values(details).every((service) => service.healthy !== false)
    const someAreDegraded = Object.values(details).some((service) => service.healthy === null)
    return {
      healthy: noneAreUnhealthy ? (someAreDegraded ? 'degraded' : 'healthy') : 'unhealthy',
      details,
    }
  }

  get $descriptionOfList() {
    return 'Check the health of the application'
  }

  async #appHealthState() {
    return {
      app: {
        healthy: true,
      },
    }
  }

  async #setupState() {
    const db = await this.#app.container.make('lucid.db')
    const [systemUser, nonSystemUser] = await Promise.all([
      db.from('users').where('username', 'system').first(),
      db.from('users').where('username', '<>', 'system').where('can_login', true).first(),
    ])
    return {
      setup: {
        healthy: systemUser && nonSystemUser ? true : systemUser ? null : false,
        meta: {
          systemUserConfigured: !!systemUser,
          interfaceUserConfigured: !!nonSystemUser,
        },
      },
    }
  }
}
