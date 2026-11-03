export const contactIconLabels = {
  phone: 'Телефон',
  email: 'Почта',
  telegram: 'Telegram',
  link: 'Ссылка',
  location: 'Город',
  github: 'GitHub',
  leetcode: 'LeetCode',
} as const

export const contactGroupLabels = {
  contact: 'Связаться: телефон, почта, Telegram, город',
  profile: 'Профили: LeetCode, GitHub, LinkedIn и другие',
} as const

export type ContactIcon = keyof typeof contactIconLabels
export type ContactGroup = keyof typeof contactGroupLabels

export function getContactGroup(contact: {
  icon: ContactIcon
  group?: ContactGroup
}): ContactGroup {
  if (contact.group) return contact.group
  return ['link', 'github', 'leetcode'].includes(contact.icon) ? 'profile' : 'contact'
}
