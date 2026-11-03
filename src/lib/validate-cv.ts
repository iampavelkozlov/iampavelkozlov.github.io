import { isMonth } from './experience.ts'
import { companyOrigin, isCompanyLogo } from './company.ts'

// Одна проверка для формы и записи на диск. Неполные поля не затирают корректный файл.
export function validateCv(value: unknown): string[] {
  const errors: string[] = []
  const object = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v)
  const text = (v: unknown, path: string, optional = false) => {
    if (optional && v === undefined) return
    if (typeof v !== 'string' || (!optional && !v.trim())) errors.push(`${path}: заполните поле`)
  }
  const array = (v: unknown, path: string): unknown[] => {
    if (!Array.isArray(v)) { errors.push(`${path}: нужен список`); return [] }
    return v
  }
  const lines = (v: unknown, path: string) => array(v, path).forEach((line, i) => text(line, `${path} ${i + 1}`))
  if (!object(value)) return ['Данные резюме должны быть объектом']
  text(value.name, 'Имя'); text(value.role, 'Должность'); text(value.photo, 'Фотография')
  if (typeof value.photo === 'string' && !/^[\w./-]+\.(png|jpe?g|webp|avif)$/i.test(value.photo)) errors.push('Фотография: укажите путь к изображению в public')
  for (const key of ['summary', 'technologyStack', 'education', 'languages']) lines(value[key], key)
  array(value.contacts, 'Контакты').forEach((contact, i) => {
    const path = `Контакт ${i + 1}`
    if (!object(contact)) { errors.push(`${path}: неверный формат`); return }
    text(contact.label, path)
    if (!['phone', 'email', 'telegram', 'link', 'location', 'github', 'leetcode'].includes(String(contact.icon))) errors.push(`${path}: выберите иконку`)
    if (contact.group !== undefined && !['contact', 'profile'].includes(String(contact.group))) errors.push(`${path}: выберите группу контакта`)
    if (contact.href !== undefined) {
      text(contact.href, `${path}, ссылка`, true)
      if (typeof contact.href === 'string' && contact.href && !/^(https?:\/\/|mailto:|tel:)/i.test(contact.href)) errors.push(`${path}: допустимы http, https, mailto и tel`)
    }
  })
  array(value.experience, 'Опыт').forEach((job, i) => {
    const path = `Работа ${i + 1}`
    if (!object(job)) { errors.push(`${path}: неверный формат`); return }
    text(job.company, `${path}, компания`); text(job.role, `${path}, должность`)
    if (job.companyUrl !== undefined && job.companyUrl !== '' && !companyOrigin(job.companyUrl)) errors.push(`${path}: укажите полный адрес сайта с http:// или https://`)
    if (job.companyLogo !== undefined && !isCompanyLogo(job.companyLogo)) errors.push(`${path}: некорректная иконка компании`)
    text(job.description, `${path}, описание`, true)
    if (!isMonth(job.startDate)) errors.push(`${path}: укажите начало в формате ГГГГ-ММ`)
    if (job.endDate !== null && !isMonth(job.endDate)) errors.push(`${path}: укажите окончание или «Работаю сейчас»`)
    if (isMonth(job.startDate) && isMonth(job.endDate) && job.endDate < job.startDate) errors.push(`${path}: окончание раньше начала`)
    array(job.groups, `${path}, команды`).forEach((group, j) => {
      if (!object(group)) { errors.push(`${path}, команда ${j + 1}: неверный формат`); return }
      text(group.title, `${path}, название команды`, true)
      lines(group.highlights, `${path}, достижения`)
    })
  })
  return errors
}
