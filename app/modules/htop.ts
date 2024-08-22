import { ApiServiceModule } from '#services/api'
import os from 'node:os'
import pidusage from 'pidusage'

import type { ApplicationService } from '@adonisjs/core/types'
import type { PM3 } from '#services/pm3'
import type { UpdateCommandContext } from '#services/api'

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
        paths: this.#app.mediamtx.paths,
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
        paths: this.#app.mediamtx.paths,
      }
    }
  }

  async update(ctx: UpdateCommandContext) {
    const pm3: PM3 = await this.#app.container.make('pm3')
    const { action } = ctx.payload
    switch (action) {
      case 'start':
        await pm3.start(ctx.entity)
        break

      case 'stop':
        await pm3.stop(ctx.entity)
        break

      case 'restart':
        await pm3.restart(ctx.entity)
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }
    return {}
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
    const pm3: PM3 = await this.#app.container.make('pm3')
    const usage = await pidusage(process.pid)
    const nestMtxProcess = {
      name: 'nestmtx',
      pid: process.pid,
      cpu: usage.cpu,
      memory: usage.memory,
      uptime: usage.elapsed,
    }
    const children = await pm3.stats()
    return [nestMtxProcess, ...children]
  }

  get $descriptionOfList() {
    return 'Get the HTOP Report'
  }
}
