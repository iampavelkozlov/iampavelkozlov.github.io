export type ContactIcon = 'phone' | 'email' | 'telegram' | 'link' | 'location'

export interface Contact {
  icon: ContactIcon
  label: string
  href?: string
}

export interface ExperienceGroup {
  title?: string
  highlights: string[]
}

export interface Experience {
  role: string
  company: string
  period: string
  description: string
  groups: ExperienceGroup[]
}

export interface CvData {
  name: string
  role: string
  photo: string
  contacts: Contact[]
  summary: string[]
  technologyStack: string[]
  experience: Experience[]
  education: string[]
  languages: string[]
}
