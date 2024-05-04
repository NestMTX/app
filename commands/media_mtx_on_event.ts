import { BaseCommand, args } from '@adonisjs/core/ace'
import joi from 'joi'
import type { CommandOptions } from '@adonisjs/core/types/ace'

const MediaMTXEvents = {
  init: ['MTX_PATH', 'RTSP_PORT'],
  demand: ['MTX_PATH', 'MTX_QUERY', 'RTSP_PORT'],
  unDemand: ['MTX_PATH', 'MTX_QUERY', 'RTSP_PORT'],
  ready: ['MTX_PATH', 'MTX_QUERY', 'RTSP_PORT', 'MTX_SOURCE_TYPE', 'MTX_SOURCE_ID'],
  notReady: ['MTX_PATH', 'MTX_QUERY', 'RTSP_PORT', 'MTX_SOURCE_TYPE', 'MTX_SOURCE_ID'],
  read: ['MTX_PATH', 'MTX_QUERY', 'RTSP_PORT', 'MTX_READER_TYPE', 'MTX_READER_ID'],
  unread: ['MTX_PATH', 'MTX_QUERY', 'RTSP_PORT', 'MTX_READER_TYPE', 'MTX_READER_ID'],
  recordSegmentCreate: ['MTX_PATH', 'RSTP_PORT', 'MTX_SEGMENT_PATH'],
  recordSegmentComplete: ['MTX_PATH', 'RSTP_PORT', 'MTX_SEGMENT_PATH'],
}

export default class MediaMtxOnEvent extends BaseCommand {
  static commandName = 'mediamtx:on:event'
  static description = 'Event Handler for MediaMTX Events'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'The event to handle' })
  declare event: keyof typeof MediaMtxOnEvent

  async run() {
    /**
     * Validate that we're dealing with a known event
     */
    const knownEventSchema = joi
      .string()
      .valid(...Object.keys(MediaMTXEvents))
      .required()
    const { error } = knownEventSchema.validate(this.event)
    if (error) {
      this.logger.error(error)
      process.exit(1)
    }
    /**
     * Generate the payload which will be sent to the main process
     */
    const event: keyof typeof MediaMTXEvents = this.event as keyof typeof MediaMTXEvents
    const payload: Record<string, string | undefined> = {}
    const schema = joi
      .object(
        Object.assign(
          {},
          ...MediaMTXEvents[event].map((key) => ({ [key]: joi.string().required() }))
        )
      )
      .required()
      .unknown(false)
    const keys: string[] = MediaMTXEvents[event]
    keys.forEach((key) => {
      payload[key] = process.env[key]
    })
    const { error: payloadError } = schema.validate(payload)
    if (payloadError) {
      this.logger.error(payloadError)
      process.exit(1)
    }
    // const ipcSocketPath = this.app.tmpPath('ipc.sock')
    // this.logger.info('Hello world from "MediaMtxOnEvent"')
  }
}
