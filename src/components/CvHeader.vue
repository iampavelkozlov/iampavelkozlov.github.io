<script setup lang="ts">
import {
  ExternalLink,
  Link as LinkIcon,
  Mail,
  MapPin,
  Phone,
  Send,
} from '@lucide/vue'
import type { Component } from 'vue'
import { reachGoal } from '../lib/analytics'
import type { Contact } from '../types/cv'

defineProps<{
  name: string
  role: string
  photoSrc: string
  contacts: Contact[]
}>()

const icons: Record<Contact['icon'], Component> = {
  phone: Phone,
  email: Mail,
  telegram: Send,
  link: LinkIcon,
  location: MapPin,
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
  <header class="cv-header">
    <div class="identity">
      <img class="portrait" :src="photoSrc" :alt="`Фотография ${name}`" />

      <div class="identity-copy">
        <h1 id="resume-name">{{ name }}</h1>
        <p class="role">{{ role }}</p>
      </div>
    </div>

    <address class="contacts" aria-label="Контактная информация">
      <template v-for="contact in contacts" :key="contact.label">
        <a
          v-if="contact.href"
          class="contact"
          :href="contact.href"
          :target="isExternal(contact.href) ? '_blank' : undefined"
          :rel="isExternal(contact.href) ? 'noreferrer' : undefined"
          @click="reachGoal(contactGoal(contact))"
        >
          <component :is="icons[contact.icon]" :size="17" :stroke-width="1.9" />
          <span>{{ contact.label }}</span>
          <ExternalLink v-if="isExternal(contact.href)" class="external-mark" :size="11" />
        </a>

        <span v-else class="contact contact--plain">
          <component :is="icons[contact.icon]" :size="17" :stroke-width="1.9" />
          <span>{{ contact.label }}</span>
        </span>
      </template>
    </address>
  </header>
</template>
