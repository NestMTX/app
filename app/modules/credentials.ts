import { ApiServiceModule } from '#services/api'
import type { CreateCommandContext } from '#services/api'
import Joi from 'joi'
import I18NException from '#exceptions/i18n'

export default class CredentialsModule implements ApiServiceModule {
  get schemas() {
    return {
      create: Joi.object({}),
      update: Joi.object({}).unknown(true),
    }
  }

  get description() {
    return 'Manage Google Cloud Platform and Google Device Access Console credentials'
  }
}
