import type { ContactGroup, ContactIcon } from '../lib/contacts.ts'

export interface Contact {
  icon: ContactIcon
  label: string
  href?: string
  group?: ContactGroup
}

export interface ExperienceGroup {
  title?: string
  highlights: string[]
}

export interface Experience {
  role: string
  company: string
  companyUrl?: string
  companyLogo?: string
  startDate: string
  endDate: string | null
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
