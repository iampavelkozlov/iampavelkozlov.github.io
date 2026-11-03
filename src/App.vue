<script setup lang="ts">
import { useCurrentDate } from './composables/useCurrentDate'
import Resume from './components/Resume.vue'
import { cv } from './data/cv'

const now = useCurrentDate()
</script>

<template>
  <Resume
    :cv="cv"
    :now="now"
  />
</template>
