import { BaseCommand } from '@adonisjs/core/ace'
import { createCanvas, loadImage } from 'canvas'
import { readFile } from 'node:fs/promises'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class Images extends BaseCommand {
  static commandName = 'mediamtx:make:images'
  static description = 'Make MediaMTX Placeholder Images'

  static options: CommandOptions = {}

  async run() {
    this.logger.info('Creating MediaMTX Placeholder Images')
    const width = 640
    const height = 480
    const backgroundSvgPath = this.app.makePath('resources/images/background.svg')
    const iconSvgPath = this.app.makePath('resources/images/icon.svg')
    const noSuchCameraImagePath = this.app.tmpPath('no-such-camera.jpg')
    const canvas = createCanvas(width, height)
    const context = canvas.getContext('2d')
    context.fillStyle = '#000000'
    context.fillRect(0, 0, width, height)
    const [backgroundImageBuffer, iconImageBuffer] = await Promise.all([
      readFile(backgroundSvgPath),
      readFile(iconSvgPath),
    ])
    const [backgroundImage, iconImage] = await Promise.all([
      loadImage(backgroundImageBuffer),
      loadImage(iconImageBuffer),
    ])
  }
}
