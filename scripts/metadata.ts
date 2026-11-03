import type { CvData } from '../src/types/cv.ts'

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)

export function withCvMetadata(html: string, cv: CvData) {
  const title = `${cv.name} — ${cv.role}`
  const description = cv.summary[0] || title
  const values: Record<string, string> = {
    author: cv.name, description,
    'og:site_name': cv.name, 'og:title': title, 'og:description': description,
    'twitter:title': title, 'twitter:description': description,
    'profile:first_name': cv.name.split(' ')[0] || '',
    'profile:last_name': cv.name.split(' ').slice(1).join(' '),
  }
  html = html.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escapeHtml(title)}</title>`)
  html = html.replace(/<meta\s+(?:name|property)="([^"]+)"\s+content="[^"]*"\s*\/?>/g, (tag: string, key: string) => values[key] === undefined ? tag : tag.replace(/content="[^"]*"/, () => `content="${escapeHtml(values[key]!)}"`))
  return html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (_, open: string, raw: string, close: string) => {
    const schema = JSON.parse(raw)
    for (const node of schema['@graph']) {
      if (node['@type'] === 'WebSite') node.name = cv.name
      if (node['@type'] === 'ProfilePage') {
        node.name = title; node.description = description
        Object.assign(node.mainEntity, { name: cv.name, jobTitle: cv.role, image: new URL(cv.photo, node.url).href, sameAs: cv.contacts.flatMap(contact => contact.href?.startsWith('https://') ? [contact.href] : []), knowsAbout: cv.technologyStack })
      }
    }
    return `${open}\n${JSON.stringify(schema, null, 2).replaceAll('<', '\\u003c')}\n${close}`
  })
}
