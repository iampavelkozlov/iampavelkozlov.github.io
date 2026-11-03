import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { companyOrigin, isCompanyLogo } from '../../src/lib/company.ts'

const cache = new Map()
const privateIpv4 = /^(0|10|127|169\.254|172\.(1[6-9]|2\d|3[01])|192\.168|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])|198\.(18|19)|22[4-9]|2[3-5]\d)\./
function publicAddress(address) {
  if (isIP(address) === 4) return !privateIpv4.test(address)
  return isIP(address) === 6 && /^[23][a-f0-9]{3}:/i.test(address)
}

async function download(input, limit, options, signal, redirects = 0) {
  const url = new URL(input)
  if (!companyOrigin(url.href) || (url.port && !['80', '443'].includes(url.port))) throw new Error('Недопустимый адрес')
  const addresses = await (options.lookup || lookup)(url.hostname.replace(/^\[|\]$/g, ''), { all: true })
  if (!addresses.length || addresses.some(item => !publicAddress(item.address))) throw new Error('Нужен публичный сайт компании')
  const response = await (options.fetch || fetch)(url, { redirect: 'manual', signal, headers: { Accept: 'image/*,text/html;q=0.8', 'User-Agent': 'CV-Builder/1.0' } })
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    await response.body?.cancel()
    if (redirects >= 3 || !response.headers.get('location')) throw new Error('Слишком много перенаправлений')
    return download(new URL(response.headers.get('location'), url), limit, options, signal, redirects + 1)
  }
  if (!response.ok) { await response.body?.cancel(); throw new Error(`HTTP ${response.status}`) }
  const chunks = []
  let size = 0
  for await (const chunk of response.body) {
    size += chunk.length
    if (size > limit) throw new Error('Файл иконки слишком большой')
    chunks.push(chunk)
  }
  return { bytes: Buffer.concat(chunks), url: url.href }
}

function imageData(bytes) {
  let type
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) type = 'png'
  else if (bytes.subarray(0, 4).equals(Buffer.from([0, 0, 1, 0]))) type = 'x-icon'
  else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) type = 'jpeg'
  else if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') type = 'webp'
  if (!type) throw new Error('Ответ не является favicon')
  return `data:image/${type};base64,${bytes.toString('base64')}`
}

export async function fetchCompanyLogo(site, options = {}) {
  const origin = companyOrigin(site)
  if (!origin) return undefined
  const signal = AbortSignal.timeout(12_000)
  const candidates = []
  try {
    const page = await download(site, 512_000, options, AbortSignal.any([signal, AbortSignal.timeout(4000)]))
    for (const match of page.bytes.toString('utf8').matchAll(/<link\b[^>]*>/gi)) {
      const attrs = Object.fromEntries([...match[0].matchAll(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map(attr => [attr[1].toLowerCase(), attr[2] ?? attr[3] ?? attr[4]]))
      if (/(^|\s)(icon|apple-touch-icon)(\s|$)/i.test(attrs.rel || '') && attrs.href) {
        candidates.push(new URL(attrs.href.replaceAll('&amp;', '&'), page.url).href)
      }
    }
  } catch { /* Некоторые сайты блокируют HTML, но отдают /favicon.ico. */ }
  candidates.push(`${origin}/favicon.ico`)
  for (const candidate of [...new Set(candidates)].slice(0, 4)) {
    try { return imageData((await download(candidate, 70_000, options, AbortSignal.any([signal, AbortSignal.timeout(2500)]))).bytes) }
    catch { /* Следующая иконка; HTML-заглушки не сохраняем. */ }
  }
  try {
    // Резерв для сайтов, блокирующих прямое скачивание. Домен отправляется Google
    // только при локальном сохранении; посетители сайта не обращаются к сервису.
    return imageData((await download(`https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(origin)}&sz=64`, 70_000, options, signal)).bytes)
  } catch { return undefined }
}

export async function syncCompanyLogos(data, previous, options = {}) {
  const warnings = []
  const savedLogos = new Map(previous.experience.filter(job => isCompanyLogo(job.companyLogo)).map(job => [companyOrigin(job.companyUrl), job.companyLogo]))
  await Promise.all(data.experience.map(async job => {
    const origin = companyOrigin(job.companyUrl)
    delete job.companyLogo
    if (!origin) return
    const saved = savedLogos.get(origin)
    if (saved) { job.companyLogo = saved; return }
    let entry = cache.get(origin)
    if (!entry || entry.expires < Date.now() || options.fetch) {
      entry = { expires: Date.now() + 5 * 60_000, promise: fetchCompanyLogo(job.companyUrl, options) }
      if (!options.fetch) cache.set(origin, entry)
    }
    const logo = await entry.promise
    if (logo) job.companyLogo = logo
    else warnings.push(job.company)
  }))
  return warnings
}
