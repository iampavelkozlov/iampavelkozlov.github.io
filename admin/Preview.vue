<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import Resume from '../src/components/Resume.vue'
import { useCurrentDate } from '../src/composables/useCurrentDate'
import type { CvData } from '../src/types/cv'
const data = ref<CvData>()
const now = useCurrentDate()
const receive = (event: MessageEvent) => {
  if (
    event.origin === location.origin &&
    event.source === parent &&
    event.data?.type === 'cv-preview'
  )
    data.value = event.data.data
}
onMounted(() => {
  window.addEventListener('message', receive)
  parent.postMessage({ type: 'cv-preview-ready' }, location.origin)
})
onUnmounted(() => {
  window.removeEventListener('message', receive)
})
</script>
<template>
  <Resume
    v-if="data"
    :cv="data"
    :now="now"
  />
</template>
