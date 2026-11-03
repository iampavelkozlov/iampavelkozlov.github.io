import { onMounted, onUnmounted, ref } from 'vue'

export function useCurrentDate() {
  const now = ref(new Date())
  let timer: ReturnType<typeof setInterval> | undefined

  onMounted(() => {
    timer = setInterval(() => {
      now.value = new Date()
    }, 60_000)
  })
  onUnmounted(() => {
    if (timer !== undefined) clearInterval(timer)
  })

  return now
}
