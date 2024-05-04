import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import type { CommandContext } from '#services/api'
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
          ctx.command = 'read'
        } else {
          ctx.command = 'list'
        }
        break
      case 'POST':
        ctx.command = 'create'
        break
      case 'PUT':
        ctx.command = 'update'
        break
      case 'DELETE':
        ctx.command = 'delete'
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
