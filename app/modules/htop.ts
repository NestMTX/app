import { ApiServiceModule } from '#services/api'
import os from 'node:os'

import type { ApplicationService } from '@adonisjs/core/types'
import type PM2 from 'pm2'

import type { ProcessDescription } from 'pm2'

export default class HtopModule implements ApiServiceModule {
  #app: ApplicationService
  constructor(app: ApplicationService) {
    this.#app = app
  }

  get description() {
    return 'Health & Table of Processes'
  }

  get schemas() {
    return {}
  }

  async list() {
    try {
      const [cpu, memory, processes] = await Promise.all([
        this.#getCpuUsage(),
        this.#getMemoryUsage(),
        this.#getProcessList(),
      ])
      return {
        cpu,
        memory,
        processes,
      }
    } catch (error) {
      console.log(error)
      return {
        cpu: [],
        memory: {
          total: 0,
          used: 0,
        },
        processes: [],
      }
    }
  }

  async #getCpuUsage() {
    const cpus = os.cpus()
    return cpus.map((cpu, index) => {
      const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0)
      return {
        cpu: index + 1,
        user: (cpu.times.user / total) * 100,
        nice: (cpu.times.nice / total) * 100,
        sys: (cpu.times.sys / total) * 100,
        idle: (cpu.times.idle / total) * 100,
        irq: (cpu.times.irq / total) * 100,
      }
    })
  }

  async #getMemoryUsage() {
    const total = os.totalmem()
    const free = os.freemem()
    const used = total - free
    return {
      total,
      used,
    }
  }

  async #getProcessList() {
    const pm2: typeof PM2 = await this.#app.container.make('pm2')
    const list: ProcessDescription[] = await new Promise<ProcessDescription[]>(
      (resolve, reject) => {
        pm2.list((err, processDescriptionList) => {
          if (err) {
            return reject(err)
          } else {
            return resolve(processDescriptionList)
          }
        })
      }
    )
    return list.map((p) => ({
      pid: p.pid,
      name: p.name,
      cpu: p.monit?.cpu || 0,
      memory: p.monit?.memory || 0,
    }))
  }

  get $descriptionOfList() {
    return 'Get the HTOP Report'
  }
}
