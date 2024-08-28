import { promises as fs } from 'node:fs'
import { execa } from 'execa'
import { resolve, join, dirname } from 'node:path'

const APP_ROOT = resolve(new URL('../', import.meta.url).pathname)
const GUI_ROOT = resolve(APP_ROOT, 'gui')
const PUBLIC_ROOT = resolve(APP_ROOT, 'public')
const GUI_BUILD_OUTPUT_ROOT = resolve(GUI_ROOT, '.output', 'public')

const copyRecursive = async (src: string, dest: string) => {
  const stat = await fs.lstat(src)
  if (stat.isDirectory()) {
    await fs.mkdir(dest, { recursive: true })
    const entries = await fs.readdir(src)
    for (const entry of entries) {
      const srcPath = join(src, entry)
      const destPath = join(dest, entry)
      await copyRecursive(srcPath, destPath)
    }
  } else {
    await fs.mkdir(dirname(dest), { recursive: true })
    await fs.copyFile(src, dest)
  }
}

const clearPublicRoot = async () => {
  const entries = await fs.readdir(PUBLIC_ROOT)
  for (const entry of entries) {
    const entryPath = join(PUBLIC_ROOT, entry)
    if (entry === '.gitignore') {
      continue
    }
    const stat = await fs.lstat(entryPath)
    if (stat.isDirectory()) {
      await fs.rm(entryPath, { recursive: true, force: true })
    } else {
      await fs.unlink(entryPath)
    }
  }
}

const run = async () => {
  console.log('Clearing public directory...')
  await clearPublicRoot()
  console.log('Building GUI...')
  await execa('yarn', ['build'], { cwd: GUI_ROOT, stdio: 'inherit' })
  console.log('Copying GUI build output to public directory...')
  await copyRecursive(GUI_BUILD_OUTPUT_ROOT, PUBLIC_ROOT)
  console.log('Done!')
}

run()
