export class MissingStreamCharacteristicsException extends Error {
  readonly missing: string[]
  readonly characteristics: any

  constructor(missing: string[], characteristics: any) {
    super(
      `Missing stream characteristics: ${missing.join(', ')}. It is likely that the stream URL timed out.`
    )
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
    this.missing = missing
    this.characteristics = characteristics
  }
}

export class UndefinedStreamCharacteristicsException extends Error {
  readonly hostname: any

  constructor(hostname: string) {
    super(
      `Error getting stream characteristics for camera being served by ${hostname}: It is likely that the stream URL timed out or is otherwise unavailable.`
    )
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
    this.hostname = hostname
  }
}
