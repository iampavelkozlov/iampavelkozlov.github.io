export type ContactIcon = 'phone' | 'email' | 'telegram' | 'link' | 'location' | 'github' | 'leetcode'

export interface Contact {
  icon: ContactIcon
  label: string
  href?: string
  group?: 'contact' | 'profile'
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
