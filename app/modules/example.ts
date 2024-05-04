import { ApiServiceModule } from '#services/api'
import Joi from 'joi'

export default class ExampleModule implements ApiServiceModule {
  get schemas() {
    return {
      create: Joi.object({
        name: Joi.string().required(),
        active: Joi.boolean().default(true),
        sampled_on: Joi.date().iso(),
        choices: Joi.array().items(
          Joi.object({
            text: Joi.string().required(),
            value: Joi.number().required(),
          })
        ),
      }),
      update: Joi.object({
        name: Joi.string().required(),
        active: Joi.boolean().default(true),
        sampled_on: Joi.date().iso(),
        choices: Joi.array().items(
          Joi.object({
            text: Joi.string().required(),
            value: Joi.number().required(),
          })
        ),
      }),
    }
  }

  async list() {
    return []
  }

  async create() {
    return {}
  }

  async read() {
    return {}
  }

  async update() {
    return {}
  }

  async delete() {
    return {}
  }
}
