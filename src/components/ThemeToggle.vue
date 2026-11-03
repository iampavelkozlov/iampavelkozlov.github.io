<script setup lang="ts">
import { Moon, Sun } from '@lucide/vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const dark = ref(false)
const label = computed(() => dark.value ? 'Включить светлую тему' : 'Включить тёмную тему')
let preference: string | null = null
let media: MediaQueryList | undefined

function applyTheme(isDark: boolean) {
  dark.value = isDark
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#141813' : '#f1f1ef')
}

function toggle() {
  applyTheme(!dark.value)
  preference = dark.value ? 'dark' : 'light'
  try { localStorage.setItem('cv-theme', preference) } catch { /* Выбор работает и без доступа к хранилищу. */ }
}

function systemChanged() {
  if (!preference) applyTheme(Boolean(media?.matches))
}

function storageChanged(event: StorageEvent) {
  if (event.key !== 'cv-theme' && event.key !== null) return
  preference = event.newValue === 'dark' || event.newValue === 'light' ? event.newValue : null
  applyTheme(preference ? preference === 'dark' : Boolean(media?.matches))
}

onMounted(() => {
  media = matchMedia('(prefers-color-scheme: dark)')
  try { preference = localStorage.getItem('cv-theme') } catch { /* Используем системную тему. */ }
  if (preference !== 'light' && preference !== 'dark') preference = null
  applyTheme(preference ? preference === 'dark' : media.matches)
  media.addEventListener('change', systemChanged)
  window.addEventListener('storage', storageChanged)
})

onUnmounted(() => {
  media?.removeEventListener('change', systemChanged)
  window.removeEventListener('storage', storageChanged)
})
</script>

<template>
  <button class="theme-toggle" type="button" role="switch" :aria-checked="dark" :aria-label="label" :title="label" @click="toggle">
    <Sun v-if="dark" :size="17" :stroke-width="1.8" aria-hidden="true" />
    <Moon v-else :size="17" :stroke-width="1.8" aria-hidden="true" />
  </button>
</template>
