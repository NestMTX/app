/**
 * This service translates LCRUD requests from the available communication methods (HTTP, MQTT, Socket.IO, etc.) into commands which can be appropriately handled
 * It is created as an instance which can be hooked to later in the application so requests can be routed to the appropriate handlers
 */
import type User from '#models/user'
import joi from 'joi'
import string from '@adonisjs/core/helpers/string'

interface BaseCommandContext {
  // The command to be executed
  command: 'list' | 'create' | 'read' | 'update' | 'delete'
  // The module to be operated on
  module: string
  // The ID of the request
  requestId: string
  // The user making the request
  user?: User
}

interface SpecificEntityCommandContext extends BaseCommandContext {
  // The entity to be operated on
  entity: string
}

export interface ListCommandContext extends BaseCommandContext {
  // The query payload to be used in the command
  payload: any // @TODO: Define the shape of the payload for list commands
}
export interface CreateCommandContext extends BaseCommandContext {
  // The payload to be used in the command
  payload: any
}
export interface ReadCommandContext extends SpecificEntityCommandContext {}
export interface UpdateCommandContext extends SpecificEntityCommandContext {
  // The payload to be used in the command
  payload: any
}
export interface DeleteCommandContext extends SpecificEntityCommandContext {}

/**
 * Defines the shape of the context object which will be passed to the command handler
 */
export type CommandContext =
  | ListCommandContext
  | CreateCommandContext
  | ReadCommandContext
  | UpdateCommandContext
  | DeleteCommandContext

export interface ApiServiceModule {
  insecure?: boolean
  description?: string
  list?: (context: ListCommandContext) => Promise<any>
  create?: (context: CreateCommandContext) => Promise<any>
  read?: (context: ReadCommandContext) => Promise<any>
  update?: (context: UpdateCommandContext) => Promise<any>
  delete?: (context: DeleteCommandContext) => Promise<any>
  schemas: {
    create?: joi.ObjectSchema
    update?: joi.ObjectSchema
  }
  $descriptionOfList?: string
  $descriptionOfCreate?: string
  $descriptionOfRead?: string
  $descriptionOfUpdate?: string
  $descriptionOfDelete?: string
}

interface ApiServiceRequestErrorDetailContext extends Record<string, any> {
  [key: string]: any
  key: string
  label: string
  value: any
}

interface ApiServiceRequestErrorDetail {
  message: string
  path?: string
  type?: string
  context?: ApiServiceRequestErrorDetailContext
}

/**
 * Custom error class for returning request errors in a standard format
 */
export class ApiServiceRequestError extends Error {
  readonly context: CommandContext
  readonly details: Array<ApiServiceRequestErrorDetail>
  constructor(
    message: string,
    context: CommandContext,
    details: Array<ApiServiceRequestErrorDetail> = []
  ) {
    // Pass the message to the parent Error class
    super(message)

    // Ensure the name of this error is the same as the class name
    this.name = this.constructor.name

    // This line is needed to make the .stack property work correctly
    Error.captureStackTrace(this, this.constructor)

    // Save the context object to the error
    this.context = context

    // Save the details object to the error
    this.details = details
  }
}

/**
 * Custom error class for returning 404 errors in a standard format
 */
export class ApiServiceRequestNotFoundError extends ApiServiceRequestError {}

/**
 * Custom error class for returning 401 errors in a standard format
 */
export class ApiServiceUnauthorizedError extends ApiServiceRequestError {}

export class ApiService {
  #modules: Map<string, ApiServiceModule>

  constructor() {
    this.#modules = new Map()
  }

  get modules() {
    const ret = {
      add: (name: string, mod: ApiServiceModule) => {
        if (this.#modules.has(name)) throw new Error(`Module ${name} already exists`)
        this.#modules.set(name, mod)
      },
      remove: (name: string) => {
        this.#modules.delete(name)
      },
    }
    Object.freeze(ret)
    return ret
  }

  private get contextSchema() {
    return joi.object({
      command: joi.string().valid('list', 'create', 'read', 'update', 'delete').required(),
      module: joi.string().required(),
      requestId: joi.string().required(),
      user: joi.object().optional(),
      entity: joi.when('command', {
        switch: [
          { is: 'read', then: joi.string().required() },
          { is: 'update', then: joi.string().required() },
          { is: 'delete', then: joi.string().required() },
        ],
        otherwise: joi.forbidden(),
      }),
      payload: joi.when('command', {
        switch: [
          { is: 'list', then: joi.object().required() },
          { is: 'create', then: joi.object().required() },
          { is: 'update', then: joi.object().required() },
        ],
        otherwise: joi.forbidden(),
      }),
    })
  }

  async handle(context: CommandContext) {
    // Validate the context object
    try {
      await this.contextSchema.validateAsync(context)
    } catch (err) {
      return new ApiServiceRequestError('Invalid Context', context, err.details)
    }
    let ctx:
      | ListCommandContext
      | CreateCommandContext
      | ReadCommandContext
      | UpdateCommandContext
      | DeleteCommandContext

    switch (context.command) {
      case 'list':
        ctx = context as ListCommandContext
        break
      case 'create':
        ctx = context as CreateCommandContext
        break
      case 'read':
        ctx = context as ReadCommandContext
        break
      case 'update':
        ctx = context as UpdateCommandContext
        break
      case 'delete':
        ctx = context as DeleteCommandContext
        break
      default:
        return new ApiServiceRequestError('Invalid Command', context)
    }
    const mod = this.#modules.get(ctx.module)
    if (!mod) {
      return new ApiServiceRequestError(`Module ${context.module} not initialized`, context)
    }
    if (!ctx.user && !mod.insecure) {
      return new ApiServiceUnauthorizedError('Unauthorized', context)
    }
    if ('function' !== typeof mod[ctx.command]) {
      return new ApiServiceRequestError(
        `Module ${context.module} does not implement a ${context.command} method`,
        context
      )
    }
    try {
      return await mod[ctx.command]!(ctx as any)
    } catch (error) {
      return new ApiServiceRequestError(error.message, context)
    }
  }

  /**
   * Used to automagically generate an OpenAPI manifest which can be used to generate documentation and client libraries
   */
  describe() {
    const ret = {
      openapi: '3.0.3',
      info: {
        title: 'NestMTX API',
        description: 'The API for the NestMTX application',
        version: '1.0.0',
      },
      paths: {} as any,
      tags: [] as any,
      components: {
        schemas: {
          error: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
              },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                    },
                    path: {
                      type: 'string',
                    },
                    type: {
                      type: 'string',
                    },
                    context: {
                      type: 'object',
                      properties: {
                        key: {
                          type: 'string',
                        },
                        label: {
                          type: 'string',
                        },
                        value: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
              context: {
                type: 'object',
                properties: {
                  command: {
                    type: 'string',
                  },
                  module: {
                    type: 'string',
                  },
                  requestId: {
                    type: 'string',
                  },
                  user: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                        format: 'int64',
                      },
                      email: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        } as any,
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        } as any,
      } as any,
    }
    this.#modules.forEach((mod, name) => {
      let createSchemaKey: string | undefined
      let updateSchemaKey: string | undefined
      if (mod.schemas.create) {
        createSchemaKey = string.camelCase([name, 'create'].join(' '))
        ret.components.schemas[createSchemaKey] = this.#joiSchemaToOpenApi(
          mod.schemas.create.describe()
        )
      }
      if (mod.schemas.update) {
        updateSchemaKey = string.camelCase([name, 'update'].join(' '))
        ret.components.schemas[updateSchemaKey] = this.#joiSchemaToOpenApi(
          mod.schemas.update.describe()
        )
      }
      if (mod.description) {
        ret.tags.push({
          name,
          description: mod.description,
        })
      } else {
        ret.tags.push({
          name,
          description: `Operations on ${name} entities`,
        })
      }
      if ('function' === typeof mod.list || 'function' === typeof mod.create) {
        const path = `/api/${name}`
        const methods: any = {}
        if ('function' === typeof mod.list) {
          methods.get = {
            operationId: string.camelCase([name, 'list'].join(' ')),
            summary: this.#getDescriptionOfOperation(mod, name, 'list'),
            tags: [name],
            security: mod.insecure
              ? []
              : [
                  {
                    BearerAuth: [],
                  },
                ],
            responses: {
              '200': {
                description: 'OK',
              },
              '400': {
                description: 'Bad Request',
                content: {
                  'application/json': {
                    schema: {
                      $ref: `#/components/schemas/error`,
                    },
                  },
                },
              },
              '500': {
                description: 'Application Error',
                content: {
                  'application/json': {
                    schema: {
                      $ref: `#/components/schemas/error`,
                    },
                  },
                },
              },
            },
          }
        }
        if ('function' === typeof mod.create) {
          methods.post = {
            operationId: string.camelCase([name, 'create'].join(' ')),
            summary: this.#getDescriptionOfOperation(mod, name, 'create'),
            tags: [name],
            security: mod.insecure
              ? []
              : [
                  {
                    BearerAuth: [],
                  },
                ],
            requestBody: createSchemaKey
              ? {
                  content: {
                    'application/json': {
                      schema: {
                        $ref: `#/components/schemas/${createSchemaKey}`,
                      },
                    },
                    'application/x-www-form-urlencoded': {
                      schema: {
                        $ref: `#/components/schemas/${createSchemaKey}`,
                      },
                    },
                  },
                }
              : undefined,
            responses: {
              '201': {
                description: 'Created',
              },
              '400': {
                description: 'Bad Request',
                content: {
                  'application/json': {
                    schema: {
                      $ref: `#/components/schemas/error`,
                    },
                  },
                },
              },
              '500': {
                description: 'Application Error',
                content: {
                  'application/json': {
                    schema: {
                      $ref: `#/components/schemas/error`,
                    },
                  },
                },
              },
            },
          }
        }
        ret.paths[path] = methods
      }
      if (
        'function' === typeof mod.read ||
        'function' === typeof mod.update ||
        'function' === typeof mod.delete
      ) {
        const path = `/api/${name}/{id}`
        const methods: any = {}
        if ('function' === typeof mod.read) {
          methods.get = {
            operationId: string.camelCase([name, 'read'].join(' ')),
            summary: this.#getDescriptionOfOperation(mod, name, 'read'),
            tags: [name],
            security: mod.insecure
              ? []
              : [
                  {
                    BearerAuth: [],
                  },
                ],
            parameters: [
              {
                name: 'id',
                in: 'path',
                description: 'The ID of the entity to read',
                required: true,
                schema: {
                  type: 'integer',
                  format: 'int64',
                },
              },
            ],
            responses: {
              '200': {
                description: 'OK',
              },
              '400': {
                description: 'Bad Request',
                content: {
                  'application/json': {
                    schema: {
                      $ref: `#/components/schemas/error`,
                    },
                  },
                },
              },
              '404': {
                description: 'Entity Not Found',
                content: {
                  'application/json': {
                    schema: {
                      $ref: `#/components/schemas/error`,
                    },
                  },
                },
              },
              '500': {
                description: 'Application Error',
                content: {
                  'application/json': {
                    schema: {
                      $ref: `#/components/schemas/error`,
                    },
                  },
                },
              },
            },
          }
        }
        if ('function' === typeof mod.update) {
          methods.put = {
            operationId: string.camelCase([name, 'update'].join(' ')),
            summary: this.#getDescriptionOfOperation(mod, name, 'update'),
            tags: [name],
            security: mod.insecure
              ? []
              : [
                  {
                    BearerAuth: [],
                  },
                ],
            parameters: [
              {
                name: 'id',
                in: 'path',
                description: 'The ID of the entity to update',
                required: true,
                schema: {
                  type: 'integer',
                  format: 'int64',
                },
              },
            ],
            requestBody: updateSchemaKey
              ? {
                  content: {
                    'application/json': {
                      schema: {
                        $ref: `#/components/schemas/${updateSchemaKey}`,
                      },
                    },
                    'application/x-www-form-urlencoded': {
                      schema: {
                        $ref: `#/components/schemas/${updateSchemaKey}`,
                      },
                    },
                  },
                }
              : undefined,
            responses: {
              '201': {
                description: 'Updated',
              },
              '400': {
                description: 'Bad Request',
                content: {
                  'application/json': {
                    schema: {
                      $ref: `#/components/schemas/error`,
                    },
                  },
                },
              },
              '404': {
                description: 'Entity Not Found',
                content: {
                  'application/json': {
                    schema: {
                      $ref: `#/components/schemas/error`,
                    },
                  },
                },
              },
              '500': {
                description: 'Application Error',
                content: {
                  'application/json': {
                    schema: {
                      $ref: `#/components/schemas/error`,
                    },
                  },
                },
              },
            },
          }
        }
        if ('function' === typeof mod.delete) {
          methods.delete = {
            operationId: string.camelCase([name, 'delete'].join(' ')),
            summary: this.#getDescriptionOfOperation(mod, name, 'delete'),
            tags: [name],
            security: mod.insecure
              ? []
              : [
                  {
                    BearerAuth: [],
                  },
                ],
            parameters: [
              {
                name: 'id',
                in: 'path',
                description: 'The ID of the entity to delete',
                required: true,
                schema: {
                  type: 'integer',
                  format: 'int64',
                },
              },
            ],
            responses: {
              '202': {
                description: 'Deleted',
              },
              '400': {
                description: 'Bad Request',
                content: {
                  'application/json': {
                    schema: {
                      $ref: `#/components/schemas/error`,
                    },
                  },
                },
              },
              '404': {
                description: 'Entity Not Found',
                content: {
                  'application/json': {
                    schema: {
                      $ref: `#/components/schemas/error`,
                    },
                  },
                },
              },
              '500': {
                description: 'Application Error',
                content: {
                  'application/json': {
                    schema: {
                      $ref: `#/components/schemas/error`,
                    },
                  },
                },
              },
            },
          }
        }
        ret.paths[path] = methods
      }
    })
    return ret
  }

  #getDescriptionOfOperation(mod: ApiServiceModule, modName: string, command: string) {
    switch (command) {
      case 'list':
        if ('undefined' !== typeof mod.$descriptionOfList) {
          return mod.$descriptionOfList
        }
        return `List all ${modName} entities`
      case 'create':
        if ('undefined' !== typeof mod.$descriptionOfCreate) {
          return mod.$descriptionOfCreate
        }
        return `Create a new ${modName} entity`
      case 'read':
        if ('undefined' !== typeof mod.$descriptionOfRead) {
          return mod.$descriptionOfRead
        }
        return `Read an ${modName} entity`
      case 'update':
        if ('undefined' !== typeof mod.$descriptionOfUpdate) {
          return mod.$descriptionOfUpdate
        }
        return `Update an ${modName} entity`
      case 'delete':
        if ('undefined' !== typeof mod.$descriptionOfDelete) {
          return mod.$descriptionOfDelete
        }
        return `Delete an ${modName} entity`
      default:
        return ''
    }
  }

  #joiSchemaToOpenApi(description: joi.Description) {
    const ret: any = {}
    if (description.type) {
      switch (description.type) {
        case 'string':
          ret.type = 'string'
          break
        case 'number':
          ret.type = 'number'
          break
        case 'boolean':
          ret.type = 'boolean'
          break
        case 'array':
          ret.type = 'array'
          break
        case 'object':
          ret.type = 'object'
          // @ts-expect-error
          if (description.flags?.presence) {
            // @ts-expect-error
            ret.required = description.flags.presence === 'required'
          }
          break
        case 'date':
          ret.type = 'string'
          ret.format = 'date-time'
          break
        default:
          // Add more type mappings as needed
          break
      }
    }
    if (description.description) {
      ret.description = description.description
    }

    if (description.valids) {
      ret.enum = description.valids
    }

    if (description.example && description.example.length) {
      ret.example = description.example[0]
    }

    if ('object' === description.type && description.keys) {
      ret.properties = {}
      for (const key in description.keys) {
        ret.properties[key] = this.#joiSchemaToOpenApi(description.keys[key])
      }
    }

    if ('array' === description.type && description.items) {
      ret.items = this.#joiSchemaToOpenApi(description.items[0])
    }
    return ret
  }
}
