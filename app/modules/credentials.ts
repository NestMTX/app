import { ApiServiceModule } from '#services/api'
import type { CreateCommandContext } from '#services/api'
import Credential from '#models/credential'
import Joi from 'joi'
import I18NException from '#exceptions/i18n'
import db from '@adonisjs/lucid/services/db'

export default class CredentialsModule implements ApiServiceModule {
  get schemas() {
    return {
      create: Joi.object({
        description: Joi.string().required(),
        oauth_client_id: Joi.string().required(),
        oauth_client_secret: Joi.string().required(),
        dac_project_id: Joi.string().allow(null),
      }),
      update: Joi.object({
        description: Joi.string().required(),
      }),
    }
  }

  get description() {
    return 'Manage Google Cloud Platform and Google Device Access Console credentials'
  }

  async list(context: CreateCommandContext) {
    const { search, page, itemsPerPage, sortBy } = context.payload
    const query = db.from(Credential.table)
    if (search) {
      query.where((builder) => {
        builder.where('description', 'ilike', `%${search}%`)
        builder.orWhere('oauth_client_id', 'ilike', `%${search}%`)
        builder.orWhere('dac_project_id', 'ilike', `%${search}%`)
      })
    }
    if (sortBy) {
      // query.orderBy(sortBy)
    }
    let pageAsInt = Number.parseInt(page)
    let itemsPerPageAsInt = Number.parseInt(itemsPerPage)
    if (!Number.isNaN(pageAsInt) && !Number.isNaN(itemsPerPageAsInt)) {
      pageAsInt = Math.max(1, pageAsInt)
      itemsPerPageAsInt = Math.max(1, itemsPerPageAsInt)
    }
    const results = await query.paginate(pageAsInt, itemsPerPageAsInt)
    const ret = {
      ...context.payload,
      page: pageAsInt,
      itemsPerPage: itemsPerPageAsInt,
      total: results.total,
      items: results.all(),
    }
    return ret
  }

  get $descriptionOfList() {
    return 'Search for and list credentials'
  }

  async create(context: CreateCommandContext) {
    const {
      description,
      oauth_client_id: oauthClientId,
      oauth_client_secret: oauthClientSecret,
      dac_project_id: dacProjectId,
    } = context.payload
    const credential = new Credential()
    credential.description = description
    credential.oauthClientId = oauthClientId
    credential.oauthClientSecret = oauthClientSecret
    credential.dacProjectId = dacProjectId
    await credential.save()
    return credential.id
  }

  get $descriptionOfCreate() {
    return 'Add new credentials'
  }
}
