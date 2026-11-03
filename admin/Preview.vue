<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import Resume from '../src/components/Resume.vue'
import type { CvData } from '../src/types/cv'
const data = ref<CvData>()
const now = ref(new Date())
const receive = (event: MessageEvent) => {
  if (event.origin === location.origin && event.source === parent && event.data?.type === 'cv-preview') data.value = event.data.data
}
let timer: ReturnType<typeof setInterval>
onMounted(() => {
  window.addEventListener('message', receive)
  parent.postMessage({ type: 'cv-preview-ready' }, location.origin)
  timer = setInterval(() => { now.value = new Date() }, 60_000)
})
onUnmounted(() => { window.removeEventListener('message', receive); clearInterval(timer) })
</script>
<template><Resume v-if="data" :cv="data" :now="now" /></template>
