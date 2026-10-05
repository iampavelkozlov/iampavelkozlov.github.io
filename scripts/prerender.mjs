import { readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const outputDirectory = resolve('dist')
const templatePath = resolve(outputDirectory, 'index.html')
const serverDirectory = resolve(outputDirectory, 'server')
const serverEntry = pathToFileURL(resolve(serverDirectory, 'entry-server.js')).href
const appOutlet = '<div id="app"></div>'

const [{ render }, template] = await Promise.all([
  import(serverEntry),
  readFile(templatePath, 'utf8'),
])

if (!template.includes(appOutlet)) {
  throw new Error('Application outlet was not found in the generated HTML')
}

const renderedHtml = template.replace(appOutlet, `<div id="app">${await render()}</div>`)

await writeFile(templatePath, renderedHtml)
await rm(serverDirectory, { recursive: true })
