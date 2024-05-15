import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import type {
  CommandContext,
  ListCommandContext,
  CreateCommandContext,
  ReadCommandContext,
  UpdateCommandContext,
  DeleteCommandContext,
} from '#services/api'
import {
  ApiServiceRequestError,
  ApiServiceRequestNotFoundError,
  ApiServiceUnauthorizedError,
} from '#services/api'

export default class ApiController {
  async handle({ request, response, auth, params }: HttpContext) {
    const apiService = await app.container.make('api/service')
    const ctx: Partial<CommandContext> = {
      module: params.module,
      requestId: request.id(),
      user: auth.user,
    }
    switch (request.method()) {
      case 'GET':
        if (params.id) {
          ;(ctx as ReadCommandContext).command = 'read'
          ;(ctx as ReadCommandContext).entity = params.id.toString()
        } else {
          ;(ctx as ListCommandContext).command = 'list'
          ;(ctx as ListCommandContext).payload = request.all()
        }
        break
      case 'POST':
        ;(ctx as CreateCommandContext).command = 'create'
        ;(ctx as CreateCommandContext).payload = request.all()
        break
      case 'PUT':
        ;(ctx as UpdateCommandContext).command = 'update'
        ;(ctx as UpdateCommandContext).payload = request.all()
        ;(ctx as UpdateCommandContext).entity = params.id.toString()
        break
      case 'DELETE':
        ;(ctx as DeleteCommandContext).command = 'delete'
        ;(ctx as DeleteCommandContext).entity = params.id.toString()
        break
    }
    const res = await apiService.handle(ctx as CommandContext)
    if (res instanceof Error) {
      if (res instanceof ApiServiceRequestError) {
        const status =
          res instanceof ApiServiceRequestNotFoundError
            ? 404
            : res instanceof ApiServiceUnauthorizedError
              ? 401
              : 400
        return response.status(status).send({
          error: {
            message: res.message,
            details: res.details,
            context: res.context,
          },
        })
      }
      return response.status(500).send(res)
    }
    switch (ctx.command) {
      case 'create':
      case 'update':
        return response.status(201).send(res)
      default:
        return response.send(res)
    }
  }
}
