import { randomBytes } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { createServer } from 'vite'
import { readCv, saveCv, publishCv } from './lib/cv-store.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const port = Number(process.env.ADMIN_PORT || 4174)
const token = randomBytes(32).toString('hex')
let queue = Promise.resolve()
const server = await createServer({
  root, server: { host: '127.0.0.1', port, strictPort: true, cors: false, watch: { ignored: ['**/src/data/cv.json'] } },
  plugins: [{
    name: 'local-cv-admin',
    configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        const path = req.url?.split('?')[0]
        if (path !== '/admin' && !path?.startsWith('/api/')) return next()
        const reply = (status, body) => res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }).end(JSON.stringify(body))
        if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(req.headers.host) || (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`)) return reply(403, { error: 'Недопустимый источник запроса' })
        if (path === '/admin' && req.method === 'GET') {
          const html = await vite.transformIndexHtml('/admin', await readFile(resolve(root, 'admin/index.html'), 'utf8'))
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }).end(html)
          return
        }
        try {
          if (path === '/api/cv' && req.method === 'GET') return reply(200, { ...await readCv(root), token })
          if (!['/api/cv', '/api/publish'].includes(path)) return reply(404, { error: 'Не найдено' })
          if (req.method !== (path === '/api/cv' ? 'PUT' : 'POST')) return reply(405, { error: 'Метод не поддерживается' })
          if (req.headers['x-cv-admin'] !== token || !req.headers['content-type']?.startsWith('application/json')) return reply(403, { error: 'Перезагрузите админку' })
          const chunks = []
          let size = 0
          for await (const chunk of req) {
            size += chunk.length
            if (size > 1024 * 1024) return reply(413, { error: 'Слишком большой файл' })
            chunks.push(chunk)
          }
          let body
          try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { return reply(400, { error: 'Некорректный JSON' }) }
          if (!body || typeof body !== 'object') return reply(400, { error: 'Нужен объект с данными и ревизией файла' })
          const operation = queue.then(async () => {
            const saved = await saveCv(root, body.data, body.revision)
            if (path === '/api/publish') {
              try { return { ...saved, ...await publishCv(root) } }
              catch (error) { throw Object.assign(new Error(`Файл сохранён локально. Git: ${error.stderr || error.message}`), { status: 502, revision: saved.revision }) }
            }
            return saved
          })
          queue = operation.catch(() => {})
          return reply(200, await operation)
        } catch (error) { reply(error.status || 500, { error: error.message, revision: error.revision }) }
      })
    },
  }],
})
await server.listen()
console.log(`Локальная админка: http://127.0.0.1:${port}/admin`)
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await queue; await server.close(); process.exit(0) })
