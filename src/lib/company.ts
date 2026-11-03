export function companyOrigin(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return ''
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return ''
    return url.origin
  } catch { return '' }
}

export function isCompanyLogo(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 100_000 && /^data:image\/(png|jpeg|webp|x-icon|vnd\.microsoft\.icon);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
}
