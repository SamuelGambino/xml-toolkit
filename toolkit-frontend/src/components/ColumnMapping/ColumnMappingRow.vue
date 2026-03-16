<script setup lang="ts">
import { computed, ref } from 'vue'
import DropBox from '@/components/DropBox/DropBox.vue'

type TSelectedFilter = "none" | "mod" | "product" | "category";

const props = defineProps<{
  column: { index: number; name: string }
  mappedType: string
  options: { value: string; label: string; filter?: "mod" | "product" | "category" }[]
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

const selectedFilter = ref<TSelectedFilter>('none')

const filterOptions: { value: TSelectedFilter; label: string }[] = [
  { value: 'none', label: 'Все' },
  { value: 'category', label: 'Категории' },
  { value: 'product', label: 'Товары' },
  { value: 'mod', label: 'Модификаторы' },
]


const filteredOptions = computed(() => {
  if (selectedFilter.value === 'none') {
    return props.options
  }

  return props.options.filter(
    (opt) => !opt.filter || opt.filter === selectedFilter.value
  )
});

const filterName = computed(() => `mapping-filter-${props.column.index}`)
const filterId = (value: TSelectedFilter) => `${filterName.value}-${value}`

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
  <li class="column-mapping__row" :class="dynamicClasses" @dragover="handleDragOver" @drop="handleDrop">
    <button type="button" class="column-mapping__drag-handle" draggable="true" aria-label="Перетащить строку"
      @dragstart="emit('dragstart', column.index)" @dragend="emit('dragend')">
      ⋮⋮
    </button>

    <div class="column-mapping__wrapper">
      <div class="column-mapping__content">
        <span class="column-mapping__name">{{ column.name }}</span>
        <DropBox :options="filteredOptions" :modelValue="mappedType"
          @update:modelValue="emit('update:mappedType', $event)" />
      </div>

      <fieldset class="column-mapping__filter">
        <legend>Фильтр списка:</legend>
        <div class="column-mapping__filter-options">
          <div class="column-mapping__filter-item" v-for="option in filterOptions" :key="option.value">
            <input type="radio" :id="filterId(option.value)" :name="filterName" :value="option.value"
              v-model="selectedFilter">
            <label :for="filterId(option.value)">{{ option.label }}</label>
          </div>
        </div>
      </fieldset>
    </div>
  </li>
</template>
