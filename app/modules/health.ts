import { ApiServiceModule } from '#services/api'

export default class HealthModule implements ApiServiceModule {
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
    return {
      app: true,
    }
  }

  get $descriptionOfList() {
    return 'Check the health of the application'
  }
}
