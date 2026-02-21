<script setup lang="ts">
import './DropBox.css'

const props = defineProps<{
  options: { value: string; label: string }[]
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const modelValue = defineModel<string>('modelValue', { required: true })

const updateMapping = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value
  emit('update:modelValue', value)
  modelValue.value = value
}
</script>

<template>
  <select class="drop-box" :value="modelValue" :options="options" @change="updateMapping($event)">
    <option v-for="opt in options" :key="opt.value" :value="opt.value">
      {{ opt.label }}
    </option>
  </select>
</template>
