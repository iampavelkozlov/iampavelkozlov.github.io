import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { readCv } from './lib/cv-store.mjs'

export async function renderPdf(html, baseUrl) {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 900 } })
    const origin = new URL(baseUrl).origin
    await page.route('**/*', (route) => {
      const url = new URL(route.request().url())
      return url.origin === origin || url.protocol === 'data:' ? route.continue() : route.abort()
    })
    // PDF не запускает аналитику или клиентские скрипты; используется готовый SSR HTML.
    const document = html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace('<head>', `<head><base href="${baseUrl}">`)
    await page.emulateMedia({ media: 'print' })
    // Навигация задаёт origin документа: иначе Chromium блокирует web fonts и
    // crossorigin CSS относительно about:blank, даже при наличии <base>.
    await page.route(baseUrl, (route) =>
      route.fulfill({ contentType: 'text/html', body: document }),
    )
    await page.goto(baseUrl, { waitUntil: 'load' })
    await page.evaluate(async () => {
      await document.fonts.ready
      await Promise.all([...document.images].map((img) => img.decode()))
      const actions = document.querySelector('.page-actions')
      if (!actions || getComputedStyle(actions).display !== 'none')
        throw new Error('Не загрузились печатные стили резюме')
    })
    return await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      tagged: true,
    })
  } finally {
    await browser.close()
  }
}

export function devPdfPlugin() {
  return {
    name: 'local-cv-pdf',
    apply: 'serve',
    configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        if (req.url?.split('?')[0] !== '/CV.pdf') return next()
        if (req.method !== 'GET') {
          res.writeHead(405).end()
          return
        }
        try {
          const { data } = await readCv(vite.config.root)
          const { render } = await vite.ssrLoadModule('/src/entry-server.ts')
          const address = vite.httpServer.address()
          const baseUrl = `http://127.0.0.1:${address.port}/`
          const template = await vite.transformIndexHtml(
            '/',
            await readFile(resolve(vite.config.root, 'index.html'), 'utf8'),
          )
          const html = template
            .replace('<div id="app"></div>', `<div id="app">${await render(data)}</div>`)
            .replace('</head>', '<link rel="stylesheet" href="/src/style.css?direct"></head>')
          const pdf = await renderPdf(html, baseUrl)
          res
            .writeHead(200, { 'Content-Type': 'application/pdf', 'Cache-Control': 'no-store' })
            .end(pdf)
        } catch (error) {
          res
            .writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
            .end(
              `Не удалось создать PDF. Выполните pnpm exec playwright install chromium.\n${error.message}`,
            )
        }
      })
    },
  }
}
