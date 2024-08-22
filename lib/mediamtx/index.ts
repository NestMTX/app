import type { Client as MediaMTXClient } from './types.js'
import { OpenAPIClientAxios } from 'openapi-client-axios/client.js'
import definition from './definition.js'

export const mediamtxClientFactory = async (
  url: string = 'http://127.0.0.1:9997',
  username: string = 'nest-rtsp',
  password: string = 'nest-rtsp'
) => {
  const api = new OpenAPIClientAxios({
    definition: {
      ...definition,
      servers: [{ url }],
    },
    axiosConfigDefaults: {
      auth: {
        username,
        password,
      },
      validateStatus: () => true,
    },
  })
  const client = await api.getClient<MediaMTXClient>()
  return client
}

export { MediaMTXClient }
