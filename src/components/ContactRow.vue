<script setup lang="ts">
import { Link as LinkIcon, Mail, MapPin, Phone, Send } from '@lucide/vue'
import type { Component } from 'vue'
import { reachGoal } from '../lib/analytics'
import type { Contact } from '../types/cv'
import GithubIcon from './GithubIcon.vue'
import LeetcodeIcon from './LeetcodeIcon.vue'

defineProps<{
  contacts: Contact[]
  label: string
}>()

const icons: Record<Contact['icon'], Component> = {
  phone: Phone,
  email: Mail,
  telegram: Send,
  link: LinkIcon,
  location: MapPin,
  github: GithubIcon,
  leetcode: LeetcodeIcon,
}

const isExternal = (href?: string) => Boolean(href?.startsWith('http'))

const contactGoal = (contact: Contact) => {
  if (contact.href?.startsWith('tel:')) return 'phone_click'
  if (contact.href?.startsWith('mailto:')) return 'email_click'
  if (contact.href?.includes('t.me/')) return 'telegram_click'
  if (contact.href?.includes('leetcode.com/')) return 'leetcode_click'

  return 'contact_link_click'
}
</script>

<template>
  <address
    class="contacts"
    :aria-label="label"
  >
    <template
      v-for="contact in contacts"
      :key="contact.label"
    >
      <a
        v-if="contact.href"
        class="contact"
        :href="contact.href"
        :target="isExternal(contact.href) ? '_blank' : undefined"
        :rel="isExternal(contact.href) ? 'noreferrer' : undefined"
        @click="reachGoal(contactGoal(contact))"
      >
        <component
          :is="icons[contact.icon]"
          :size="17"
          :stroke-width="1.9"
          aria-hidden="true"
        />
        <span>{{ contact.label }}</span>
      </a>

      <span
        v-else
        class="contact"
      >
        <component
          :is="icons[contact.icon]"
          :size="17"
          :stroke-width="1.9"
          aria-hidden="true"
        />
        <span>{{ contact.label }}</span>
      </span>
    </template>
  </address>
</template>
