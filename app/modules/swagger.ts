import type { ApplicationService } from '@adonisjs/core/types'
import { ApiServiceModule } from '#services/api'

export default class SwaggerModule implements ApiServiceModule {
  #app: ApplicationService
  constructor(app: ApplicationService) {
    this.#app = app
  }

  get description() {
    return 'API Specification'
  }

  get insecure() {
    return true
  }

  get schemas() {
    return {}
  }

  async list() {
    const apiService = await this.#app.container.make('api/service')
    return apiService.describe()
  }

  get $descriptionOfList() {
    return 'Get the OpenAPI specification for the API'
  }
}
