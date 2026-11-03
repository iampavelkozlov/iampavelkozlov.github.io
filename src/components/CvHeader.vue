<script setup lang="ts">
import { computed } from 'vue'
import ContactRow from './ContactRow.vue'
import PortraitPhoto from './PortraitPhoto.vue'
import { getContactGroup } from '../lib/contacts'
import type { Contact } from '../types/cv'

const props = defineProps<{
  name: string
  role: string
  photoSrc: string
  contacts: Contact[]
}>()

const isProfile = (contact: Contact) => getContactGroup(contact) === 'profile'
const directContacts = computed(() => props.contacts.filter((contact) => !isProfile(contact)))
const profiles = computed(() => props.contacts.filter(isProfile))
</script>

<template>
  <header class="cv-header">
    <PortraitPhoto
      :src="photoSrc"
      :name="name"
    />

    <div class="identity-copy">
      <h1 id="resume-name">{{ name }}</h1>
      <p class="role">{{ role }}</p>
    </div>

    <ContactRow
      v-if="directContacts.length"
      class="contacts-direct"
      :contacts="directContacts"
      label="Контактная информация"
    />
    <ContactRow
      v-if="profiles.length"
      class="contacts-profiles"
      :contacts="profiles"
      label="Профессиональные профили"
    />
  </header>
</template>
