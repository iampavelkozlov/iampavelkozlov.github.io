<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import Resume from './components/Resume.vue'
import { cv } from './data/cv'

const now = ref(new Date())
let timer: ReturnType<typeof setInterval>
onMounted(() => { timer = setInterval(() => { now.value = new Date() }, 60_000) })
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <Resume :cv="cv" :now="now" />
</template>
