import { ApiServiceModule } from '#services/api'
import type {
  ListCommandContext,
  CreateCommandContext,
  ReadCommandContext,
  UpdateCommandContext,
  DeleteCommandContext,
} from '#services/api'
import Users from '#models/user'
import Joi from 'joi'
import I18NException from '#exceptions/i18n'
import db from '@adonisjs/lucid/services/db'

export default class UsersModule implements ApiServiceModule {
  get schemas() {
    return {
      create: Joi.object({
        username: Joi.string().required().min(3).max(255),
        password: Joi.string().required().min(5).max(255),
        can_login: Joi.boolean().required(),
      }),
      update: Joi.object({
        password: Joi.string().optional().min(5).max(255),
        can_login: Joi.boolean().required(),
      }).unknown(true),
    }
  }

  get description() {
    return 'Manage Users'
  }

  async list(context: ListCommandContext) {
    const { search, page, itemsPerPage, sortBy } = context.payload
    const query = db.from(Users.table).where('id', '<>', 0)
    if (search) {
      query.where((builder) => {
        builder.where('username', 'like', `%${search}%`)
      })
    }
    if (sortBy) {
      // @todo: implement sorting
      // query.orderBy(sortBy)
    }
    query.orderBy('id', 'desc')
    let pageAsInt = Number.parseInt(page)
    let itemsPerPageAsInt = Number.parseInt(itemsPerPage)
    if (!Number.isNaN(pageAsInt) && !Number.isNaN(itemsPerPageAsInt)) {
      pageAsInt = Math.max(1, pageAsInt)
      itemsPerPageAsInt = Math.max(1, itemsPerPageAsInt)
    }
    const results = await query.paginate(pageAsInt, itemsPerPageAsInt)
    const items = await Promise.all(
      results.all().map(async (item) => {
        const user = Users.$createFromAdapterResult(item)!
        return user
      })
    )
    const ret = {
      ...context.payload,
      page: pageAsInt,
      itemsPerPage: itemsPerPageAsInt,
      total: results.total,
      items,
    }
    return ret
  }

  async create(context: CreateCommandContext) {
    const user = new Users()
    user.username = context.payload.username
    user.password = context.payload.password
    user.canLogin = context.payload.can_login
    await user.save()
  }

  async read(context: ReadCommandContext) {
    return await Users.findOrFail(Number.parseInt(context.entity))
  }

  async update(context: UpdateCommandContext) {
    const user = await Users.findOrFail(Number.parseInt(context.entity))
    if (
      user.id === context.user!.id &&
      'undefined' !== typeof context.payload.can_login &&
      context.payload.can_login !== user.canLogin
    ) {
      throw new I18NException('errors.users.update.cannotChangeOwnLoginAbility')
    }
    if ('undefined' !== typeof context.payload.password) {
      user.password = context.payload.password
    }
    if ('undefined' !== typeof context.payload.can_login) {
      user.canLogin = context.payload.can_login
    }
    await user.save()
  }

  async delete(context: DeleteCommandContext) {
    if (Number.parseInt(context.entity) === 0) {
      throw new I18NException('errors.users.delete.cannotDeleteSystemUser')
    } else if (Number.parseInt(context.entity) === context.user!.id) {
      throw new I18NException('errors.users.delete.cannotDeleteSelf')
    }
    const user = await Users.findOrFail(Number.parseInt(context.entity))
    await user.delete()
  }
}
