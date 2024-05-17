import { EventEmitter } from 'node:events'

const logEmitter = new EventEmitter({
  captureRejections: true,
})
export default logEmitter
