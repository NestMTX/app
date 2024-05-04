import type { CommandOptions } from '@adonisjs/core/types/ace'
import type { CommandContext } from '#services/api'
import { BaseCommand, args } from '@adonisjs/core/ace'
import { cuid } from '@adonisjs/core/helpers'
import db from '@adonisjs/lucid/services/db'
import { MigrationRunner } from '@adonisjs/lucid/migration'
import User from '#models/user'
import Joi from 'joi'
import { ApiServiceRequestError } from '#services/api'
import { inspect } from 'node:util'
import { DateTime } from 'luxon'
import app from '@adonisjs/core/services/app'

const requestPayloadSchema = Joi.object({
  command: Joi.string().valid('list', 'read', 'create', 'update', 'delete').required(),
  module: Joi.string().required(),
  requestId: Joi.string().required(),
  payload: Joi.alternatives().conditional('command', {
    switch: [
      { is: 'create', then: Joi.object().required() },
      { is: 'update', then: Joi.object().required() },
    ],
    otherwise: Joi.forbidden(),
  }),
  user: Joi.object().required(),
})

export default class CommandCommand extends BaseCommand {
  static commandName = 'command'
  static description = 'Run a command via the CLI'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({
    description:
      'The command to run. Must be one of these: "list", "create", "read", "update", "delete"',
  })
  declare command: string

  @args.string({ description: 'The module to run the command on' })
  declare module: string

  @args.string({
    description:
      'The JSON encoded payload to send to the command. Required for "create" and "update" commands.',
    allowEmptyValue: true,
    required: false,
  })
  declare payload: string

  async run() {
    const api = await app.container.make('api/service')
    const animation = this.logger.await('Booting CLI')
    animation.start()
    const migrator = new MigrationRunner(db, this.app, {
      direction: 'up',
    })
    await migrator.run()
    const systemUserExists = await db.from('users').where('username', 'system').first()
    if (!systemUserExists) {
      await db.table('users').insert({
        id: 0,
        username: 'system',
        password: 'system',
        can_login: false,
        created_at: DateTime.utc().toSQL(),
      })
    }
    animation.update('Validating Request')
    const user = await User.find(0)
    if (!user) {
      animation.stop()
      this.#exitWithError(new Error('System user not found'))
    }
    const request: any = {
      command: this.command,
      module: this.module,
      requestId: cuid(),
      user,
    }
    if (this.payload) {
      try {
        request.payload = JSON.parse(this.payload)
      } catch (error) {
        animation.stop()
        this.#exitWithError(new Error('Invalid JSON payload'))
      }
    }
    try {
      await requestPayloadSchema.validateAsync(request)
    } catch (err) {
      animation.stop()
      this.#exitWithError(new ApiServiceRequestError('Invalid Context', request, err.details))
    }
    const context: CommandContext = request
    animation.update('Processing')
    const res = await api.handle(context)
    if (res instanceof Error) {
      animation.stop()
      this.#exitWithError(res)
    }
    animation.update('Done')
    animation.stop()
    this.logger.success('Command completed')
    this.logger.info(inspect(res, false, 20, true))
  }

  #exitWithError(error: Error) {
    if (error instanceof ApiServiceRequestError) {
      this.logger.error(error.message)
      this.logger.error(inspect(error.details, false, 20, true))
    } else {
      this.logger.error(error.message)
      if (error.stack) {
        this.logger.error(error.stack)
      }
    }

    process.exit(1)
  }
}
