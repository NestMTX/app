import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'
import { logger as main } from '#services/logger'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class SilentAuthMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    const logger = main.child({ service: 'http', step: 'middleware', middleware: 'silent_auth' })
    try {
      await ctx.auth.authenticateUsing(options.guards)
    } catch (e) {
      logger.error(`Failed to authenticate request: ${(e as Error).message}`)
    }
    return next()
  }
}
