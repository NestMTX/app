import { readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import Cronjob from '#models/cronjob'
import { DateTime } from 'luxon'

import type { MiliCron } from '@jakguru/milicron'
import type { LoggerService } from '@adonisjs/core/types'
import type { ApplicationService } from '@adonisjs/core/types'

type LoggerServiceWithConfig = LoggerService & {
  config: any
}

const base = new URL('../../', import.meta.url).pathname

export abstract class CronJob {
  constructor(protected app: ApplicationService) {}
  abstract get crontab(): string
  abstract run(): void | Promise<void>
}

export const loadJobs = async (app: ApplicationService): Promise<Array<CronJob>> => {
  const jobsPath = resolve(base, 'app', 'jobs')
  const files = await readdir(jobsPath)
  const ret = await Promise.all(
    files
      .filter((file) => file.endsWith('.job.ts') || file.endsWith('.job.js'))
      .map(async (file) => {
        const { default: Job } = await import(resolve(jobsPath, file))
        if (!(Job.prototype instanceof CronJob)) {
          return undefined
        }
        return new Job(app)
      })
  )
  return ret.filter((job: Array<CronJob | undefined>) => job !== undefined) as Array<CronJob>
}

export const init = async (
  app: ApplicationService,
  cron: MiliCron,
  logger: LoggerServiceWithConfig
): Promise<void> => {
  const jobs = await loadJobs(app)
  logger.info(`Loaded ${jobs.length} jobs`)
  const doJob = async (job: CronJob) => {
    const row = await Cronjob.firstOrCreate(
      { name: job.constructor.name },
      { name: job.constructor.name }
    )
    logger.info(`Running job "${job.constructor.name}"`)
    row.lastRunAt = DateTime.now()
    await row.save()
    try {
      await job.run()
    } catch (err) {
      logger.error(`Error running job "${job.constructor.name}": ${err}`)
    }
    row.lastEndAt = DateTime.now()
    await row.save()
  }
  jobs.forEach((job) => {
    cron.$on(job.crontab, doJob.bind(null, job))
    logger.info(`Added job "${job.constructor.name}" with crontab "${job.crontab}"`)
  })
}
