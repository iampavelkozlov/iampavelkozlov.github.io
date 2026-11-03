const months = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
]

export const isMonth = (value: unknown): value is string =>
  typeof value === 'string' && /^(?!0000)\d{4}-(0[1-9]|1[0-2])$/.test(value)

const monthIndex = (value: string) => Number(value.slice(0, 4)) * 12 + Number(value.slice(5)) - 1

export function formatPeriod(start: string, end: string | null) {
  const format = (value: string) =>
    isMonth(value) ? `${months[Number(value.slice(5)) - 1]} ${value.slice(0, 4)}` : 'Укажите дату'
  return `${format(start)} — ${end === null ? 'Настоящее время' : format(end)}`
}

function plural(value: number, forms: [string, string, string]) {
  const last = value % 10
  return `${value} ${forms[value % 100 >= 11 && value % 100 <= 14 ? 2 : last === 1 ? 0 : last >= 2 && last <= 4 ? 1 : 2]}`
}

export function formatDuration(start: string, end: string | null, now = new Date()) {
  if (!isMonth(start) || (end !== null && !isMonth(end))) return ''
  const last = end === null ? now.getFullYear() * 12 + now.getMonth() : monthIndex(end)
  // Даты заданы с точностью до месяца: оба месяца входят в период работы.
  const total = last - monthIndex(start) + 1
  if (total <= 0) return ''
  const years = Math.floor(total / 12)
  const remainder = total % 12
  return [
    years ? plural(years, ['год', 'года', 'лет']) : '',
    remainder ? plural(remainder, ['месяц', 'месяца', 'месяцев']) : '',
  ]
    .filter(Boolean)
    .join(' ')
}
