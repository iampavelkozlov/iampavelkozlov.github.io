import assert from 'node:assert/strict'
import { test } from 'node:test'
import { companyOrigin, isCompanyLogo } from '../src/lib/company.ts'
import { validateCv } from '../src/lib/validate-cv.ts'
import { fetchCompanyLogo, syncCompanyLogos } from '../scripts/lib/company-logos.mjs'
import { readFile } from 'node:fs/promises'

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jX9kAAAAASUVORK5CYII=', 'base64')
const logo = `data:image/png;base64,${png.toString('base64')}`
const lookup = async () => [{ address: '93.184.216.34', family: 4 }]
const site = 'https://company.example/'

test('сайт компании допускает только HTTP(S) без встроенных credentials', () => {
  assert.equal(companyOrigin('https://company.example/team'), 'https://company.example')
  for (const value of ['', null, 'javascript:alert(1)', 'file:///etc/passwd', 'https://user:secret@company.example/']) assert.equal(companyOrigin(value), '')
  assert.ok(isCompanyLogo(logo))
  assert.ok(!isCompanyLogo('https://company.example/favicon.ico'))
  assert.ok(!isCompanyLogo('data:text/html;base64,AAAA'))
})

test('favicon из HTML сохраняется как изображение, без внешнего URL', async () => {
  const requests = []
  const fetch = async url => {
    requests.push(url.href)
    return url.pathname === '/' ? new Response('<link href="assets/favicon.png" rel="shortcut icon">') : new Response(png)
  }
  assert.equal(await fetchCompanyLogo(site, { fetch, lookup }), logo)
  assert.deepEqual(requests, [site, `${site}assets/favicon.png`])
})

test('скачанный HTML и недоступные иконки не подменяют портфельчик', async () => {
  const fetch = async url => url.pathname === '/' ? new Response('Страница без иконки') : new Response('<html>Нет доступа</html>')
  assert.equal(await fetchCompanyLogo(site, { fetch, lookup }), undefined)
})

test('перенаправления на локальные адреса не запрашиваются', async () => {
  const requests = []
  const fetch = async url => { requests.push(url.hostname); return new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/secrets' } }) }
  const resolve = async hostname => [{ address: hostname === '127.0.0.1' ? '127.0.0.1' : '93.184.216.34', family: 4 }]
  assert.equal(await fetchCompanyLogo(site, { fetch, lookup: resolve }), undefined)
  assert.ok(!requests.includes('127.0.0.1'))
})

test('смена URL обновляет favicon, повторное сохранение использует кэш в данных, пустой URL удаляет иконку', async () => {
  let requests = 0
  const fetch = async () => { requests++; return new Response(png) }
  const options = { fetch, lookup }
  const previous = { experience: [{ company: 'Компания', companyUrl: site, companyLogo: logo }] }
  const data = { experience: [{ company: 'Компания', companyUrl: 'https://another.example/', companyLogo: 'old' }] }
  assert.deepEqual(await syncCompanyLogos(data, previous, options), [])
  assert.equal(data.experience[0].companyLogo, logo)
  const count = requests
  assert.deepEqual(await syncCompanyLogos(data, structuredClone(data), options), [])
  assert.equal(requests, count)
  data.experience[0].companyUrl = ''
  await syncCompanyLogos(data, previous, options)
  assert.equal(data.experience[0].companyLogo, undefined)
  assert.equal(requests, count)
})

test('недоступный favicon не блокирует сохранение и возвращает предупреждение', async () => {
  const data = { experience: [{ company: 'Компания', companyUrl: site }] }
  const options = { lookup, fetch: async () => new Response(null, { status: 404 }) }
  assert.deepEqual(await syncCompanyLogos(data, { experience: [] }, options), ['Компания'])
  assert.equal(data.experience[0].companyLogo, undefined)
})

test('валидация формы проверяет URL компании и данные картинки', async () => {
  const data = JSON.parse(await readFile(new URL('../src/data/cv.json', import.meta.url), 'utf8'))
  data.experience[0].companyUrl = 'javascript:alert(1)'
  data.experience[0].companyLogo = 'data:text/html;base64,AAAA'
  assert.equal(validateCv(data).length, 2)
})
