import { ApiServiceModule } from '#services/api'
import type { CreateCommandContext } from '#services/api'
import Joi from 'joi'

export default class AuthModule implements ApiServiceModule {
  get schemas() {
    return {
      create: Joi.object({
        username: Joi.string().required(),
        password: Joi.string().min(6).required(),
      }),
      update: Joi.object({}).unknown(true),
    }
  }

  get insecure() {
    return true
  }

  get description() {
    return 'User Authentication Operations'
  }

  async create(context: CreateCommandContext) {
    console.log(context)
    throw Error('Not implemented')
  }

  get $descriptionOfCreate() {
    return 'Authenticate a user'
  }

  async read() {
    throw Error('Not implemented')
  }

  get $descriptionOfRead() {
    return 'Get the authenticated user'
  }

  async update() {
    throw Error('Not implemented')
  }

  get $descriptionOfUpdate() {
    return 'Refresh the authentication token'
  }

  async delete() {
    throw Error('Not implemented')
  }

  get $descriptionOfDelete() {
    return 'Logout the user'
  }
}
