<script setup lang="ts">
import { Download } from '@lucide/vue'
import { reachGoal } from '../lib/analytics'

defineProps<{
  href: string
}>()
</script>

<template>
  <a
    class="download-button"
    :href="href"
    download="Pavel-Kozlov-CV.pdf"
    @click="reachGoal('pdf_download')"
  >
    <Download :size="18" :stroke-width="2" aria-hidden="true" />
    <span>Скачать PDF</span>
  </a>
</template>
