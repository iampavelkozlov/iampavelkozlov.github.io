<script setup lang="ts">
import { Download } from '@lucide/vue'
import { reachGoal } from '../lib/analytics'

defineProps<{
  href: string
}>()
</script>

<template>
  <a
    class="download-link"
    :href="href"
    download="Pavel-Kozlov-CV.pdf"
    @click="reachGoal('pdf_download')"
  >
    <Download
      :size="15"
      :stroke-width="1.8"
      aria-hidden="true"
    />
    <span>Скачать PDF</span>
  </a>
</template>
