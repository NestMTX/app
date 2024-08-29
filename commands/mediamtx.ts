import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { Octokit } from '@octokit/rest'
import os from 'node:os'
import fs from 'node:fs'
import { join } from 'node:path'
import env from '#start/env'
import axios from 'axios'
import { execa } from 'execa'
import YAML from 'yaml'

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
    const arch = os.arch().replace('x64', 'amd64')
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
    const openApiManifestUrl = `https://raw.githubusercontent.com/bluenviron/mediamtx/${latest.name}/apidocs/openapi.yaml`
    const [{ data: releaseFile }, { data: openApiManifestFile }] = await Promise.all([
      axios.get(asset.browser_download_url, {
        responseType: 'arraybuffer',
      }),
      axios.get(openApiManifestUrl, {
        responseType: 'arraybuffer',
      }),
    ])
    const dest = join(BASE_DIR, 'tmp', asset.name)
    const binary = join(BASE_DIR, 'tmp', 'mediamtx')
    const manifest = join(BASE_DIR, 'tmp', 'mediamtx.yaml')
    const openapiManifest = join(BASE_DIR, 'tmp', 'mediamtx.openapi.yaml')
    await Promise.all([
      fs.promises.writeFile(dest, releaseFile),
      fs.promises.writeFile(openapiManifest, openApiManifestFile),
    ])
    this.logger.success(`Downloaded MediaMTX Binary for ${platform} ${arch} to ${dest}`)
    const unzippedDest = join(BASE_DIR, 'tmp', nameMatch)
    try {
      await fs.promises.mkdir(unzippedDest)
    } catch {}
    const extension = asset.name.replace(nameMatch, '')
    this.logger.info(`Cleaning up existing assets`)
    await Promise.all([
      fs.promises.rm(binary).catch(() => {}),
      fs.promises.rm(manifest).catch(() => {}),
    ])
    this.logger.info(`Uncompressing ${asset.name}`)
    switch (extension) {
      case '.zip':
        await execa('unzip', [asset.name, '-f', '-d', unzippedDest], {
          cwd: join(BASE_DIR, 'tmp'),
        })
        break

      case '.tar.gz':
        await execa('tar', ['-xzf', asset.name, '-C', unzippedDest], {
          cwd: join(BASE_DIR, 'tmp'),
        })
        break

      case 'v8.tar.gz':
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
    await Promise.all([
      fs.promises.rm(dstPath).catch(() => {}),
      fs.promises.rm(dstConfigPath).catch(() => {}),
    ])
    await fs.promises.copyFile(binarySrcPath, dstPath, fs.constants.COPYFILE_EXCL)
    await fs.promises.copyFile(configSrcPath, dstConfigPath, fs.constants.COPYFILE_EXCL)
    await fs.promises.rm(unzippedDest, { recursive: true })
    await fs.promises.chmod(dstPath, 0o755)
    this.logger.success(`Installed MediaMTX ${name} to ${dstPath}`)
    this.logger.info(`Generating type definitions for the MediaMTX API Client`)
    const { stdout } = await execa('npx', ['openapi-client-axios-typegen', openapiManifest])
    const typesDestination = join(BASE_DIR, 'lib', 'mediamtx', 'types.ts')
    await fs.promises.writeFile(typesDestination, stdout)
    await execa('npx', ['eslint', '--fix', typesDestination])
    this.logger.success(`Generated MediaMTX API Client Type Definitions`)
    this.logger.info(`Generating api specification definitions for the MediaMTX API Client`)
    const openApiDefinitionsObject = YAML.parse(openApiManifestFile.toString())
    if (
      'object' !== typeof openApiDefinitionsObject.info ||
      null === openApiDefinitionsObject.info
    ) {
      openApiDefinitionsObject.info = {}
    }
    openApiDefinitionsObject.info.version = latest.name!.replace(/^v/, '')
    const openApiDefinitionsDestination = join(BASE_DIR, 'lib', 'mediamtx', 'definition.ts')
    await fs.promises.writeFile(
      openApiDefinitionsDestination,
      `import type { OpenAPIV3 } from 'openapi-types'
const definition: OpenAPIV3.Document = ${JSON.stringify(openApiDefinitionsObject)}
export default definition`
    )
    await execa('npx', ['eslint', '--fix', openApiDefinitionsDestination])
    this.logger.success(`Generated api specification definitions for the MediaMTX API Client`)
  }
}
