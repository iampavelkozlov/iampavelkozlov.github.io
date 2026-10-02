<script setup lang="ts">
import { Download } from '@lucide/vue'

defineProps<{
  href: string
}>()
</script>

<template>
  <a class="download-button" :href="href" download="Pavel-Kozlov-CV.pdf">
    <Download :size="18" :stroke-width="2" aria-hidden="true" />
    <span>Скачать PDF</span>
  </a>
</template>
