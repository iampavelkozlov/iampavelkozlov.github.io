<script setup lang="ts">
import { BriefcaseBusiness, CalendarDays } from '@lucide/vue'
import type { Experience } from '../types/cv'
import { formatDuration, formatPeriod } from '../lib/experience'
import { ref, watch } from 'vue'

const props = defineProps<{
  experience: Experience
  now: Date
}>()
const failedLogo = ref(false)
watch(() => props.experience.companyLogo, () => { failedLogo.value = false })
</script>

<template>
  <article class="experience">
    <header class="experience-header">
      <div class="experience-context">
        <p class="experience-meta experience-company">
          <img v-if="experience.companyUrl && experience.companyLogo && !failedLogo" class="company-logo" :src="experience.companyLogo" alt="" width="17" height="17" @error="failedLogo = true" />
          <BriefcaseBusiness v-else :size="17" :stroke-width="1.9" aria-hidden="true" />
          <a v-if="experience.companyUrl" class="company-link" :href="experience.companyUrl" target="_blank" rel="noopener noreferrer">{{ experience.company }}</a>
          <span v-else>{{ experience.company }}</span>
        </p>

        <p class="experience-meta experience-period">
          <CalendarDays :size="17" :stroke-width="1.9" aria-hidden="true" />
          <span>{{ formatPeriod(experience.startDate, experience.endDate) }}</span>
          <span class="experience-duration">{{ formatDuration(experience.startDate, experience.endDate, now) }}</span>
        </p>
      </div>
      <h3>{{ experience.role }}</h3>
    </header>

    <p class="company-description">{{ experience.description }}</p>

    <div class="experience-groups">
      <section v-for="group in experience.groups" :key="group.title || group.highlights[0]">
        <h4 v-if="group.title">{{ group.title }}</h4>
        <ul>
          <li v-for="highlight in group.highlights" :key="highlight">{{ highlight }}</li>
        </ul>
      </section>
    </div>
  </article>
</template>
