<script setup lang="ts">
import { computed, ref } from 'vue'
import { makeDraggable, makeDroppable } from '@vue-dnd-kit/core'
import DropBox from '@/components/DropBox/DropBox.vue'

const props = defineProps<{
  column: { index: number; name: string }
  order: number[]
  position: number
  mappedType: string
  options: { value: string; label: string }[]
  className?: string
}>()

const emit = defineEmits<{
  (e: 'update:mappedType', value: string): void
  (e: 'reorder', value: number[]): void
}>()

const rowRef = ref<HTMLElement | null>(null)

const { isDragging, isDragOver } = makeDraggable(
  rowRef,
  {
    activation: {
      distance: 6,
    },
  },
  () => [props.position, props.order]
)

const { isDragOver: isDropOver } = makeDroppable(
  rowRef,
  {
    events: {
      onDrop: (event) => {
        const result = event.helpers.suggestSort('vertical')
        if (!result) return
        emit('reorder', result.targetItems as number[])
      },
    },
  },
  () => props.order
)

const dragOverClass = computed(() => {
  if (!isDropOver.value || !isDragOver.value) return ''
  if (isDragOver.value.top) return 'column-mapping__row--drop-before'
  if (isDragOver.value.bottom) return 'column-mapping__row--drop-after'
  return 'column-mapping__row--drop-inside'
})

const draggingClass = computed(() => (isDragging.value ? 'column-mapping__row--dragging' : ''))
</script>

<template>
  <li ref="rowRef" class="column-mapping__row" :class="[className, draggingClass, dragOverClass]">
    <span class="column-mapping__name">{{ column.name }}</span>
    <DropBox :options="options" :modelValue="mappedType" @update:modelValue="emit('update:mappedType', $event)" />
  </li>
</template>
