import { IncomingMessage, ServerResponse } from 'node:http'
import { Writable, WritableOptions } from 'node:stream'

/**
 * Creates an MJPEG server request handler.
 *
 * @param req - The HTTP request object.
 * @param res - The HTTP response object.
 * @returns An instance of MjpegServer.
 */
export function createReqHandler(req: IncomingMessage, res: ServerResponse): MjpegServer {
  return new MjpegServer(req, res)
}

export class MjpegServer extends Writable {
  private res: ServerResponse

  constructor(_req: IncomingMessage, res: ServerResponse, options?: WritableOptions) {
    super(options)

    this.res = res

    res.writeHead(200, {
      'Content-Type': 'multipart/x-mixed-replace; boundary=myboundary',
      'Cache-Control': 'no-cache',
      'Connection': 'close',
      'Pragma': 'no-cache',
    })
  }

  /**
   * Writes a JPEG image to the HTTP response stream.
   *
   * @param jpeg - The JPEG image buffer.
   * @param encoding - The encoding of the JPEG image (ignored).
   * @param callback - Callback function called after writing is done.
   */
  _write(jpeg: Buffer, _encoding: string, callback: (error?: Error | null) => void): void {
    this.res.write('--myboundary\r\n')
    this.res.write('Content-Type: image/jpeg\r\n')
    this.res.write(`Content-Length: ${jpeg.length}\r\n`)
    this.res.write('\r\n')
    this.res.write(jpeg, 'binary')
    this.res.write('\r\n')
    callback()
  }

  /**
   * Closes the MJPEG stream and ends the response.
   */
  close(): void {
    this.res.end()
  }
}
