<script setup lang="ts">
const model = defineModel<string[]>({ required: true })
defineProps<{ label: string }>()
function move(index: number, offset: number) {
  const item = model.value.splice(index, 1)[0]!
  model.value.splice(index + offset, 0, item)
}
</script>
<template>
  <div class="text-list">
    <div
      v-for="(_, index) in model"
      :key="index"
      class="list-row"
    >
      <label
        >{{ label }} {{ index + 1
        }}<textarea
          v-model="model[index]"
          rows="2"
        />
      </label>
      <div class="row-actions">
        <button
          type="button"
          :disabled="index === 0"
          :aria-label="`${label} ${index + 1}: выше`"
          @click="move(index, -1)"
        >
          ↑
        </button>
        <button
          type="button"
          :disabled="index === model.length - 1"
          :aria-label="`${label} ${index + 1}: ниже`"
          @click="move(index, 1)"
        >
          ↓
        </button>
        <button
          type="button"
          class="danger"
          :aria-label="`${label} ${index + 1}: удалить`"
          @click="model.splice(index, 1)"
        >
          Удалить
        </button>
      </div>
    </div>
    <button
      type="button"
      class="add-button"
      @click="model.push('')"
    >
      + {{ label }}
    </button>
  </div>
</template>
