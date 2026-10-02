<script setup lang="ts">
import { BriefcaseBusiness, CalendarDays } from '@lucide/vue'
import type { Experience } from '../types/cv'

defineProps<{
  experience: Experience
}>()
</script>

<template>
  <article class="experience">
    <header class="experience-header">
      <h3>{{ experience.role }}</h3>

      <p class="experience-meta">
        <BriefcaseBusiness :size="17" :stroke-width="1.9" aria-hidden="true" />
        <span>{{ experience.company }}</span>
      </p>

      <p class="experience-meta experience-period">
        <CalendarDays :size="17" :stroke-width="1.9" aria-hidden="true" />
        <span>{{ experience.period }}</span>
      </p>
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
