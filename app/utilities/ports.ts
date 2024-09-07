import { pickPort as pickPortSrc } from 'pick-port'

export interface PickPortOptions {
  type: 'tcp' | 'udp'
  ip?: string
  minPort?: number
  maxPort?: number
  reserveTimeout?: number
}

export const pickPort = async (options: PickPortOptions) => {
  return await pickPortSrc(options)
}
