import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { Octokit } from '@octokit/rest'
import os from 'node:os'
import fs from 'node:fs'
import { join } from 'node:path'
import env from '#start/env'
import axios from 'axios'
import { execa } from 'execa'

const BASE_DIR = new URL('../', import.meta.url).pathname

const octokit = new Octokit()

export default class Mediamtx extends BaseCommand {
  static commandName = 'mediamtx:install'
  static description = 'Download and install MediaMTX'

  static options: CommandOptions = {}

  async run() {
    const { data: releases } = await octokit.rest.repos.listReleases({
      owner: 'bluenviron',
      repo: 'mediamtx',
      per_page: 1,
    })
    const latest = releases[0]
    this.logger.info(`Found MediaMTX Release ${latest.name}`)
    const { name, assets } = latest
    const platform = os.platform()
    const arch = os.arch()
    const nameMatch = ['mediamtx', name, platform, arch].join('_')
    const asset = assets.find((a) => a.name.startsWith(nameMatch))
    if (!asset) {
      this.logger.error(
        `MediaMTX Release ${latest.name} does not have a binary for ${platform} ${arch}`
      )
      process.exit(1)
    } else {
      this.logger.info(`Found Asset ${asset.name} for ${platform} ${arch}`)
    }
    const { data } = await axios.get(asset.browser_download_url, {
      responseType: 'arraybuffer',
    })
    const dest = join(BASE_DIR, 'tmp', asset.name)
    const binary = join(BASE_DIR, 'tmp', 'mediamtx')
    const manifest = join(BASE_DIR, 'tmp', 'mediamtx.yml')
    await fs.promises.writeFile(dest, data)
    this.logger.success(`Downloaded MediaMTX Binary for ${platform} ${arch} to ${dest}`)
    const unzippedDest = join(BASE_DIR, 'tmp', nameMatch)
    try {
      await fs.promises.mkdir(unzippedDest)
    } catch {}
    const extension = asset.name.replace(nameMatch, '')
    this.logger.info(`Cleaning up existing assets`)
    await Promise.all([fs.promises.unlink(binary), fs.promises.unlink(manifest)])
    this.logger.info(`Uncompressing ${asset.name}`)
    switch (extension) {
      case '.zip':
        await execa('unzip', [asset.name, '-d', unzippedDest], {
          cwd: join(BASE_DIR, 'tmp'),
        })
        break

      case '.tar.gz':
        await execa('tar', ['-xzf', asset.name, '-C', unzippedDest], {
          cwd: join(BASE_DIR, 'tmp'),
        })
        break

      default:
        this.logger.error(`Unsupported archive extension ${extension}`)
        process.exit(1)
    }
    await fs.promises.unlink(dest)
    this.logger.success(`Uncompressed MediaMTX Binary to ${unzippedDest}`)
    const dstPath = env.get('MEDIA_MTX_PATH')
    const dstConfigPath = env.get('MEDIA_MTX_CONFIG_PATH')
    let binarySrcPath = join(unzippedDest, 'mediamtx')
    const configSrcPath = join(unzippedDest, 'mediamtx.yml')
    switch (platform) {
      case 'win32':
        binarySrcPath += '.exe'
        break
    }
    await fs.promises.copyFile(binarySrcPath, dstPath, fs.constants.COPYFILE_EXCL)
    await fs.promises.copyFile(configSrcPath, dstConfigPath, fs.constants.COPYFILE_EXCL)
    await fs.promises.rm(unzippedDest, { recursive: true })
    await fs.promises.chmod(dstPath, 0o755)
    this.logger.success(`Installed MediaMTX ${name} to ${dstPath}`)
  }
}
