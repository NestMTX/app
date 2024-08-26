import type { ApplicationService } from '@adonisjs/core/types'
import { ApiServiceModule } from '#services/api'
import { loadJobs } from '#services/cron'
import Cronjob from '#models/cronjob'
import { DateTime } from 'luxon'

import type { CreateCommandContext, UpdateCommandContext } from '#services/api'

export default class CronjobsModule implements ApiServiceModule {
  #app: ApplicationService
  constructor(app: ApplicationService) {
    this.#app = app
  }

  get description() {
    return 'Cronjob Statuses'
  }

  get schemas() {
    return {}
  }

  async list(context: CreateCommandContext) {
    const [jobs, rows] = await Promise.all([
      loadJobs(this.#app),
      Cronjob.query().orderBy('name', 'asc'),
    ])
    const { search, page, itemsPerPage, sortBy } = context.payload
    const records = jobs
      .map((j) => {
        const name = j.constructor.name
        const row = rows.find((r) => r.name === name)
        return {
          name,
          crontab: j.crontab,
          last_run_at: row?.lastRunAt,
          last_end_at: row?.lastEndAt,
        }
      })
      .filter((r) => !search || r.name.includes(search))
      .sort((_a, _b) => {
        if (sortBy) {
          // @todo: implement sorting
        }
        return 0
      })

    let pageAsInt = Number.parseInt(page)
    let itemsPerPageAsInt = Number.parseInt(itemsPerPage)
    if (!Number.isNaN(pageAsInt) && !Number.isNaN(itemsPerPageAsInt)) {
      pageAsInt = Math.max(1, pageAsInt)
      itemsPerPageAsInt = Math.max(1, itemsPerPageAsInt)
    }
    const ret = {
      ...context.payload,
      page: pageAsInt,
      itemsPerPage: itemsPerPageAsInt,
      total: records.length,
      items: records.slice((pageAsInt - 1) * itemsPerPageAsInt, pageAsInt * itemsPerPageAsInt),
    }
    return ret
  }

  async update(context: UpdateCommandContext) {
    const jobs = await loadJobs(this.#app)
    const job = jobs.find((j) => j.constructor.name === context.entity)
    if (job) {
      const row = await Cronjob.firstOrCreate(
        { name: job.constructor.name },
        { name: job.constructor.name }
      )
      row.lastRunAt = DateTime.now()
      await row.save()
      let error: Error | undefined
      try {
        await job.run()
      } catch (e) {
        error = e
      }
      row.lastEndAt = DateTime.now()
      await row.save()
      if (error) {
        throw error
      }
      return {}
    }
  }
}
