<script setup lang="ts">
import { X, ZoomIn } from '@lucide/vue'
import { onUnmounted, ref, useId } from 'vue'

defineProps<{ src: string; name: string }>()
const dialog = ref<HTMLDialogElement>()
const dialogId = useId()
let previousOverflow = ''
let scrollLocked = false

function open() {
  if (!dialog.value || dialog.value.open) return
  dialog.value.showModal()
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  scrollLocked = true
}

function restoreScroll() {
  if (!scrollLocked) return
  document.body.style.overflow = previousOverflow
  scrollLocked = false
}

function closeOnBackdrop(event: MouseEvent) {
  const viewer = dialog.value
  if (!viewer || event.target !== viewer) return
  const rect = viewer.getBoundingClientRect()
  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  )
    viewer.close()
}

onUnmounted(restoreScroll)
</script>

<template>
  <button
    class="portrait-trigger"
    type="button"
    :aria-label="`Увеличить фотографию ${name}`"
    aria-haspopup="dialog"
    :aria-controls="dialogId"
    title="Увеличить фото"
    @click="open"
  >
    <img
      class="portrait"
      :src="src"
      alt=""
    />
    <ZoomIn
      class="portrait-zoom"
      :size="16"
      :stroke-width="1.8"
      aria-hidden="true"
    />
  </button>
  <img
    class="portrait portrait-print"
    :src="src"
    :alt="`Фотография ${name}`"
  />
  <dialog
    :id="dialogId"
    ref="dialog"
    class="portrait-dialog"
    :aria-label="`Фотография ${name}`"
    @click="closeOnBackdrop"
    @close="restoreScroll"
  >
    <button
      class="portrait-close"
      type="button"
      aria-label="Закрыть фотографию"
      autofocus
      @click="dialog?.close()"
    >
      <X
        :size="20"
        :stroke-width="1.8"
        aria-hidden="true"
      />
    </button>
    <img
      class="portrait-large"
      :src="src"
      :alt="`Фотография ${name}`"
    />
  </dialog>
</template>
