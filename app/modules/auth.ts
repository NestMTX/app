import { ApiServiceModule } from '#services/api'
import type { CreateCommandContext } from '#services/api'
import Joi from 'joi'
import User from '#models/user'
import { DateTime } from 'luxon'
import I18NException from '#exceptions/i18n'

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
    if (context.user) {
      throw new I18NException('errors.auth.create.loggedIn')
    }
    const { username, password } = context.payload
    const user = await User.verifyCredentials(username, password)
    const token = await User.accessTokens.create(user)
    const ret = {
      bearer: token.value!.release(),
      expiration: token.expiresAt
        ? DateTime.fromJSDate(token.expiresAt).toISO()
        : DateTime.now().plus({ days: 1 }).toISO(),
      user: user.serialize(),
    }
    return ret
  }

  get $descriptionOfCreate() {
    return 'Authenticate a user'
  }
}
