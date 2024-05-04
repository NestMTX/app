import env from '#start/env'
import axios from 'axios'
import joi from 'joi'
import os from 'node:os'
import { execa } from 'execa'
import type { LoggerService } from '@adonisjs/core/types'
import type { Logger } from '@adonisjs/logger'

const ipValidationSchema = joi.string().ip({
  cidr: 'forbidden',
})

const sanitize = (ip: string) => {
  // make sure that we're only returning 1 IP address
  const ips = ip.split('\n').filter((i: string) => i)
  ip = ips[0]
  const ips2 = ip.split(',').filter((i: string) => i)
  ip = ips2[0]
  const { error } = ipValidationSchema.validate(ip)
  if (error) {
    throw error
  }
  return ip
}

const fromGoogle = async () => {
  const { data } = await axios.get('https://domains.google.com/checkip')
  return sanitize(data)
}

const fromCloudflare = async () => {
  const { data } = await axios.get('https://www.cloudflare.com/cdn-cgi/trace')
  const ip = data.split('\n').find((line: string) => line.startsWith('ip='))
  if (!ip) {
    throw new Error('Unable to find ip in cloudflare response')
  }
  return sanitize(ip.split('=')[1])
}

const fromAws = async () => {
  const { data } = await axios.get('https://checkip.amazonaws.com')
  return sanitize(data)
}

const fromAkamai = async () => {
  const { data } = await axios.get('http://whatismyip.akamai.com')
  return sanitize(data)
}

const fromIpify = async () => {
  const { data } = await axios.get('https://api.ipify.org')
  return sanitize(data)
}

const fromIfconfigMe = async () => {
  const { data } = await axios.get('https://ifconfig.me')
  return sanitize(data)
}

const fromIpEchoNet = async () => {
  const { data } = await axios.get('https://ipecho.net/plain')
  return sanitize(data)
}

const fromIpInfoIo = async () => {
  const { data } = await axios.get('https://ipinfo.io/ip')
  return sanitize(data)
}

const fromHttpBin = async () => {
  const { data } = await axios.get('https://httpbin.org/ip')
  return sanitize(data.origin)
}

const resolve = {
  google: fromGoogle,
  cloudflare: fromCloudflare,
  aws: fromAws,
  akamai: fromAkamai,
  ipify: fromIpify,
  ifconfigMe: fromIfconfigMe,
  ipEchoNet: fromIpEchoNet,
  ipInfoIo: fromIpInfoIo,
  httpBin: fromHttpBin,
}

const ipResolversListSchema = joi
  .array()
  .items(joi.string().valid(...Object.keys(resolve)))
  .min(1)

export class NATService {
  readonly #resolvers: string[] = []
  readonly #lan: Set<string> = new Set()
  #resolved?: string
  #logger?: Logger

  constructor() {
    const preConfiguredResolved = env.get('IP_PUBLIC_RESOLVED')
    const preConfiguredResolvers = env.get('IP_RESOLVERS_ENABLED')
    const preConfiguredLan = env.get('IP_LAN_RESOLVED')
    if ('string' === typeof preConfiguredResolved) {
      try {
        this.#resolved = sanitize(preConfiguredResolved)
      } catch {}
    }
    if ('string' === typeof preConfiguredResolvers) {
      this.#resolvers = preConfiguredResolvers.split(',')
      const { error } = ipResolversListSchema.validate(this.#resolvers)
      // @ts-ignore - this.#resolved might be set previous to this line,
      // but typescript has issues resolving that
      if (error && 'string' !== typeof this.#resolved) {
        throw error
      }
    }
    if ('string' !== typeof preConfiguredResolved && 'string' !== typeof preConfiguredResolvers) {
      throw new Error('IP_PUBLIC_RESOLVED or IP_RESOLVERS_ENABLED must be set')
    }
    if ('string' === typeof preConfiguredLan) {
      preConfiguredLan.split(',').forEach((ip) => {
        try {
          this.#lan.add(sanitize(ip))
        } catch {}
      })
    }
  }

  get publicIp() {
    return this.#resolved as string
  }

  get lanIps() {
    return [...this.#lan] as string[]
  }

  async boot(logger: LoggerService) {
    this.#logger = logger.child({ service: 'nat' })
    this.#resolveLanIpsFromOs()
    if ('string' === typeof this.#resolved) {
      this.#logger.info('Using pre-configured public IP', { ip: this.#resolved })
    } else {
      this.#logger.info(
        `Resolving public IP address using resolver(s): ${this.#resolvers.join(', ')}`
      )
      for (const resolver of this.#resolvers) {
        const fn = resolve[resolver as keyof typeof resolve]
        try {
          this.#resolved = await fn()
          if ('string' === typeof this.#resolved) {
            this.#logger.info(`Resolved public IP ${this.#resolved} using resolver ${resolver}`)
            return
          }
        } catch (error) {
          this.#logger.error(
            `Failed to resolve public IP using resolver ${resolver} due to error: ${error.message}`
          )
        }
      }
    }
    if ('string' !== typeof this.#resolved) {
      throw new Error(
        `Failed to resolve public IP address using resolver(s): ${this.#resolvers.join(', ')}`
      )
    } else {
      this.#logger.info(`Resolved public IP ${this.#resolved}`)
    }
    await this.#resolveLanIpsFromTerminal()
    if (this.#lan.size) {
      this.#logger.info(`Resolved ${this.#lan.size} LAN IP's`)
    } else {
      this.#logger.warn('Failed to resolve LAN IP addresses')
    }
  }

  #resolveLanIpsFromOs() {
    const interfaces = os.networkInterfaces()
    for (const name in interfaces) {
      const addresses = interfaces[name]
      for (const address of addresses!) {
        if (!address.internal) {
          try {
            this.#lan.add(sanitize(address.address))
          } catch {}
        }
      }
    }
  }

  async #resolveLanIpsFromTerminal() {
    switch (os.platform()) {
      case 'win32':
        await this.#resolveLanIpsFromWindowsTerminal()
        break
      case 'darwin':
      case 'linux':
        await this.#resolveLanIpsFromUnixTerminal()
        break
      default:
        this.#logger?.warn(
          `Unable to resolve LAN IP's from terminal: Unsupported platform "${os.platform()}"`
        )
    }
  }

  async #resolveLanIpsFromUnixTerminal() {
    const [ipv4Feedback, ipv6Feedback] = await Promise.all([
      execa('ip', ['-4', 'addr', 'show'], {
        reject: false,
      }),
      execa('ip', ['-6', 'addr', 'show'], {
        reject: false,
      }),
    ])
    const getIpsFromCmdFeedback = (str: string): Set<string> => {
      const ips = new Set<string>()
      const regex = /inet\s([0-9\.:]*)\//gm
      let m: RegExpExecArray | null
      while ((m = regex.exec(str)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
          regex.lastIndex++
        }

        // The result can be accessed through the `m`-variable.
        m.forEach((match, groupIndex) => {
          if (groupIndex === 1) {
            ips.add(match as string)
          }
        })
      }
      return ips as Set<string>
    }
    if (!(ipv4Feedback instanceof Error)) {
      const ips = getIpsFromCmdFeedback(ipv4Feedback.stdout)
      ips.forEach((ip) => this.#lan.add(ip))
    }
    if (!(ipv6Feedback instanceof Error)) {
      const ips = getIpsFromCmdFeedback(ipv6Feedback.stdout)
      ips.forEach((ip) => this.#lan.add(ip))
    }
  }

  async #resolveLanIpsFromWindowsTerminal() {
    const ipFeedback = await execa('ipconfig', ['/all'], {
      reject: false,
    })
    if (!(ipFeedback instanceof Error)) {
      const lines = ipFeedback.stdout.split(os.EOL).map((line) => line.trim().toLowerCase())
      lines.forEach((line) => {
        if (line.startsWith('ip address')) {
          const ip = line.split(':').pop()?.trim()
          if (ip) {
            try {
              this.#lan.add(sanitize(ip))
            } catch {}
          }
        }
      })
    }
  }
}
