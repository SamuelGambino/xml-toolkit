<script setup lang="ts">
import { computed } from 'vue'
import DropBox from '@/components/DropBox/DropBox.vue'

const props = defineProps<{
  column: { index: number; name: string }
  mappedType: string
  options: { value: string; label: string }[]
  className?: string
  isDragging?: boolean
  isDropBefore?: boolean
  isDropAfter?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:mappedType', value: string): void
  (e: 'dragstart', columnIndex: number): void
  (e: 'dragend'): void
  (e: 'dragover', payload: { targetIndex: number; clientY: number; rect: DOMRect }): void
  (e: 'drop', payload: { targetIndex: number; clientY: number; rect: DOMRect }): void
}>()

const dynamicClasses = computed(() => [
  props.className,
  props.isDragging ? 'column-mapping__row--dragging' : '',
  props.isDropBefore ? 'column-mapping__row--drop-before' : '',
  props.isDropAfter ? 'column-mapping__row--drop-after' : '',
])

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  const element = event.currentTarget as HTMLElement | null
  if (!element) return

  emit('dragover', {
    targetIndex: props.column.index,
    clientY: event.clientY,
    rect: element.getBoundingClientRect(),
  })
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  const element = event.currentTarget as HTMLElement | null
  if (!element) return

  emit('drop', {
    targetIndex: props.column.index,
    clientY: event.clientY,
    rect: element.getBoundingClientRect(),
  })
}
</script>

<template>
  <li
    class="column-mapping__row"
    :class="dynamicClasses"
    @dragover="handleDragOver"
    @drop="handleDrop"
  >
    <button
      type="button"
      class="column-mapping__drag-handle"
      draggable="true"
      aria-label="Перетащить строку"
      @dragstart="emit('dragstart', column.index)"
      @dragend="emit('dragend')"
    >
      ⋮⋮
    </button>

    <span class="column-mapping__name">{{ column.name }}</span>
    <DropBox :options="options" :modelValue="mappedType" @update:modelValue="emit('update:mappedType', $event)" />
  </li>
</template>
