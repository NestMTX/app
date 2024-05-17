import { Translate } from '@google-cloud/translate/build/src/v2'
import en from '../locales/en'
import dot from 'dot-object'
import cla from 'command-line-args'
import clu from 'command-line-usage'
import clp from 'cli-progress'
import c from 'ansi-colors'
import joi from 'joi'
import mustache from 'mustache'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { execa } from 'execa'

function chunk(arr: any[], len: number) {
  const chunks: any[] = []
  let i = 0
  const n = arr.length
  while (i < n) {
    chunks.push(arr.slice(i, (i += len)))
  }
  return chunks
}

const clArgs = [
  {
    name: 'language',
    alias: 'l',
    type: String,
    description: c.magenta('Language to translate into.'),
  },
  {
    name: 'force',
    alias: 'f',
    type: Boolean,
    description: c.magenta('Force translation even if key exists.'),
  },
  {
    name: 'key',
    alias: 'k',
    type: String,
    description: c.magenta('Google Translate API Key'),
  },
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: c.magenta('Display this usage guide.'),
  },
]

const options = cla(clArgs)
const usage = clu([
  {
    header: c.greenBright('i18n:generate'),
    content: c.yellowBright('Generate translations for a given language using Google Translate.'),
  },
  {
    header: c.blue('Options'),
    optionList: clArgs,
  },
])

if (options.help) {
  console.log(usage)

  process.exit(0)
}

const schema = joi.object({
  language: joi.string().required(),
  force: joi.boolean().optional().default(false),
  key: joi.string().required(),
})

const run = async () => {
  const { error, value } = schema.validate(options)
  if (error) {
    console.error(c.redBright(error.message))
    console.log(c.yellow(`Rerun with --help for usage information.`))

    process.exit(1)
  }
  const { key, language, force } = value
  console.log(c.blue(`Loading source file...`))
  const dotted = dot.dot(en)
  const keys = Object.keys(dotted)

  const dstPathForFs = join(__dirname, `../locales/${language}.ts`)

  const dstPathForImporting = join(__dirname, `../locales/${language}`)
  console.log(c.blue(`Checking if destination file exists...`))
  const exists = existsSync(dstPathForFs)
  if (!exists) {
    console.log(c.cyan(`Destination file does not exist. Creating...`))
    await writeFile(dstPathForFs, `export default {};\n`)
    console.log(c.green(`Destination file created.`))
  }
  console.log(c.blue(`Loading destination file...`))
  const { default: current } = await import(dstPathForImporting)
  const currentDotted = dot.dot(current)
  const dstDotted: Record<string, string> = {}
  if (!force) {
    keys.forEach((k) => {
      if (currentDotted[k]) {
        dstDotted[k] = currentDotted[k]
      }
    })
  }
  const keysToTranslate = keys.filter((k) => !dstDotted[k] && dotted[k])
  if (keysToTranslate.length === 0) {
    console.log(c.green(`Nothing to translate.`))

    process.exit(0)
  }
  console.log(c.cyan(`Translating ${keysToTranslate.length} keys...`))
  const translator = new Translate({ key })
  const valuesToTranslate = keysToTranslate.map((k) => dotted[k])
  const src: Array<string> = []
  const replacements: Record<string, Array<string>> = {}
  for (const [i, original] of valuesToTranslate.entries()) {
    if ('string' !== typeof original) {
      continue
    }
    const updated = original.replace(/\{(\S)*\}/g, (rv: string) => {
      if (!Array.isArray(replacements[i])) {
        replacements[i] = [] as Array<string>
      }
      const pid = replacements[i].length
      replacements[i].push(rv)
      return `{{${pid}}}`
    })
    src.push(updated)
  }
  const rawResults: Array<string> = []
  const chunks = chunk(src, 50)
  const bar = new clp.SingleBar({}, clp.Presets.shades_classic)
  bar.start(chunks.length, 0)
  for (const [i, ch] of chunks.entries()) {
    bar.update(i + 1)
    try {
      const [translations] = await translator.translate(ch, language)
      for (const term of translations) {
        rawResults.push(term)
      }
    } catch (err) {
      console.error(
        `Encountered error translating ${c.cyan(
          ch.length.toString()
        )} strings: ${c.red((err as Error).message)}`
      )
      for (let ti = 0; ti < chunk.length; ti++) {
        rawResults.push('__MISSING_TRANSLATION__')
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  bar.stop()
  const results = rawResults.map((v, i) => {
    try {
      return mustache.render(v, replacements[`${i}`])
    } catch {
      console.error(c.red(`Failed to render ${c.cyan(v)}`))
      return v
    }
  })
  if (results.every((r) => r === '__MISSING_TRANSLATION__')) {
    throw new Error('All translations failed.')
  } else {
    console.log(
      c.green(
        `Successfully translated ${c.cyan(results.length.toString())} strings. Writing results...`
      )
    )
  }
  const updated: Record<string, string> = {}
  for (const [ui, result] of results.entries()) {
    const k = keysToTranslate[ui]
    updated[k] = result
  }
  const full = Object.assign({}, dotted, updated)
  const objectified = dot.object(full)
  await writeFile(dstPathForFs, `export default ${JSON.stringify(objectified, null, 2)};\n`)
  console.log(c.green(`Finished writing results. Fixing formatting...`))
  await execa('npx', ['eslint', '--fix', dstPathForFs])
}

run()
