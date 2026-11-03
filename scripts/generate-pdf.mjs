import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { preview } from 'vite'
import { renderPdf } from './pdf.mjs'

const server = await preview({ preview: { host: '127.0.0.1', port: 0, open: false } })
try {
  const baseUrl = `http://127.0.0.1:${server.httpServer.address().port}/`
  const html = await readFile(resolve('dist/index.html'), 'utf8')
  await writeFile(resolve('dist/CV.pdf'), await renderPdf(html, baseUrl))
  console.log('PDF generated: dist/CV.pdf')
} finally { await new Promise(resolve => server.httpServer.close(resolve)) }
