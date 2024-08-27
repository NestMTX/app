import axios from 'axios'
import dot from 'dot-object'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const APP_ROOT = new URL('../', import.meta.url)

const baseUrl = `http://127.0.0.1:2000`
const api = axios.create({ baseURL: baseUrl })

let doc = `# API Modules & Methods

All NestMTX APIs share a common structure for handling requests. Each request is processed by translating it into a command that the application can handle. The following describes the API modules and methods which are available for use.
\n\n`

api.get('/api/swagger').then(async ({ data: swagger }) => {
  for (const tag of swagger.tags) {
    doc += `## The \`${tag.name}\` Module
    
${tag.description}\n\n`
    const basePath = `/api/${tag.name}`
    const itemPath = `${basePath}/{id}`
    doc += `| Operation | Description | Requires Authentication |
| --- | --- | --- |\n`
    if (swagger.paths[basePath]) {
      if (swagger.paths[basePath].get) {
        doc += `| \`list\` | ${swagger.paths[basePath].get.summary} | ${swagger.paths[basePath].get.security.length > 0 ? 'Yes' : 'No'} |\n`
      }
      if (swagger.paths[basePath].post) {
        doc += `| \`create\` | ${swagger.paths[basePath].post.summary} | ${swagger.paths[basePath].post.security.length > 0 ? 'Yes' : 'No'} |\n`
      }
    }
    if (swagger.paths[itemPath]) {
      if (swagger.paths[itemPath].get) {
        doc += `| \`read\` | ${swagger.paths[itemPath].get.summary} | ${swagger.paths[itemPath].get.security.length > 0 ? 'Yes' : 'No'} |\n`
      }
      if (swagger.paths[itemPath].put) {
        doc += `| \`update\` | ${swagger.paths[itemPath].put.summary} | ${swagger.paths[itemPath].put.security.length > 0 ? 'Yes' : 'No'} |\n`
      }
      if (swagger.paths[itemPath].delete) {
        doc += `| \`delete\` | ${swagger.paths[itemPath].delete.summary} | ${swagger.paths[itemPath].delete.security.length > 0 ? 'Yes' : 'No'} |\n`
      }
    }
    if (swagger.paths[basePath]) {
      if (swagger.paths[basePath].post) {
        const schema =
          swagger.paths[basePath].post.requestBody?.content['application/json'].schema['$ref']
        if ('string' === typeof schema) {
          const dotPath = schema.replace('#/', '').split('/').join('.') + '.properties'
          const resolved = dot.pick(dotPath, swagger)
          doc += `
### Payload for \`${tag.name}\` \`create\`

| Field | Type |
| --- | --- |
`
          for (const field in resolved) {
            doc += `| \`${field}\` | ${resolved[field].type} |\n`
          }
          doc += `\n`
        } else if (
          'object' ===
          typeof swagger.paths[basePath].post.requestBody?.content['application/json'].schema
        ) {
          console.log(swagger.paths[basePath].post.requestBody?.content['application/json'].schema)
        }
      }
    }
    if (swagger.paths[itemPath]) {
      if (swagger.paths[itemPath].put) {
        const schema =
          swagger.paths[itemPath].put.requestBody?.content['application/json'].schema['$ref']
        if ('string' === typeof schema) {
          const dotPath = schema.replace('#/', '').split('/').join('.') + '.properties'
          const resolved = dot.pick(dotPath, swagger)
          doc += `
### Payload for \`${tag.name}\` \`update\`

| Field | Type |
| --- | --- |
`
          for (const field in resolved) {
            doc += `| \`${field}\` | ${resolved[field].type} |\n`
          }
          doc += `\n`
        } else if (
          'object' ===
          typeof swagger.paths[itemPath].put.requestBody?.content['application/json'].schema
        ) {
          console.log(swagger.paths[itemPath].put.requestBody?.content['application/json'].schema)
        }
      }
    }
    doc += `\n`
  }
  const destination = resolve(APP_ROOT.pathname, 'docs', 'apis', 'structure.md')
  await writeFile(destination, doc)
  console.log(`Docs written to ${destination}`)
})
