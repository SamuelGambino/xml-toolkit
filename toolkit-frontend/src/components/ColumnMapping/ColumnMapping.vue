<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { IConfigColumnType, IProductParameterMapping } from '@/stores/useConverter'
import './ColumnMapping.css'
import DropBox from '@/components/DropBox/DropBox.vue'

const PRODUCT_PARAM_TYPE = 'ProductParameter'
const PRODUCT_PARAM_UNIT_TYPE = 'ProductParameterUnit'

const props = defineProps<{
  columns: { index: number; name: string }[]
  supportedTypes: IConfigColumnType[]
  modelValue: Record<number, string>
  unitLinks: IProductParameterMapping[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<number, string>): void
  (e: 'update:unitLinks', value: IProductParameterMapping[]): void
}>()

const emptyOption = { value: '', label: 'Не выбрано', labelRu: 'Не выбрано' }
const draggedColumn = ref<number | null>(null)
const rowOrder = ref<number[]>([])

watch(
  () => props.columns,
  (cols) => {
    const known = new Set(rowOrder.value)
    const next = cols.map((col) => col.index)
    rowOrder.value = [...rowOrder.value.filter((idx) => next.includes(idx)), ...next.filter((idx) => !known.has(idx))]
  },
  { immediate: true }
)

const hasProductParameterSelected = computed(() =>
  Object.values(props.modelValue).some((value) => value === PRODUCT_PARAM_TYPE)
)

const unresolvedUnitColumns = computed(() => {
  const selectedUnits = Object.entries(props.modelValue)
    .filter(([, value]) => value === PRODUCT_PARAM_UNIT_TYPE)
    .map(([columnIndex]) => Number(columnIndex))

  const linkedUnits = new Set(props.unitLinks.map((item) => item.unitParam).filter((v): v is number => typeof v === 'number'))
  return new Set(selectedUnits.filter((index) => !linkedUnits.has(index)))
})

const orderedColumns = computed(() => {
  const indexMap = new Map(props.columns.map((col) => [col.index, col]))
  return rowOrder.value.map((idx) => indexMap.get(idx)).filter((col): col is { index: number; name: string } => Boolean(col))
})

const optionsForColumn = (columnIndex: number) => {
  const current = props.modelValue[columnIndex]
  const base = [emptyOption, ...props.supportedTypes]
  if (hasProductParameterSelected.value || current === PRODUCT_PARAM_UNIT_TYPE) {
    return base
  }
  return base.filter((opt) => opt.value !== PRODUCT_PARAM_UNIT_TYPE)
}

const updateMapping = (columnIndex: number, columnType: string) => {
  const next = { ...props.modelValue }
  if (columnType) {
    next[columnIndex] = columnType
  } else {
    delete next[columnIndex]
  }

  const nextLinks = props.unitLinks
    .filter((item) => item.param !== columnIndex && item.unitParam !== columnIndex)
    .filter((item) => next[item.param] === PRODUCT_PARAM_TYPE)
    .filter((item) => item.unitParam == null || next[item.unitParam] === PRODUCT_PARAM_UNIT_TYPE)

  emit('update:modelValue', next)
  emit('update:unitLinks', nextLinks)
}

const onDragStart = (columnIndex: number) => {
  draggedColumn.value = columnIndex
}

const onDrop = (targetIndex: number) => {
  const sourceIndex = draggedColumn.value
  draggedColumn.value = null
  if (sourceIndex == null || sourceIndex === targetIndex) return

  const sourceType = props.modelValue[sourceIndex]
  const targetType = props.modelValue[targetIndex]

  if (sourceType === PRODUCT_PARAM_UNIT_TYPE && targetType === PRODUCT_PARAM_TYPE) {
    const next = props.unitLinks.filter((item) => item.unitParam !== sourceIndex)
    next.push({ param: targetIndex, unitParam: sourceIndex })
    emit('update:unitLinks', next)
    return
  }

  const order = [...rowOrder.value]
  const from = order.indexOf(sourceIndex)
  const to = order.indexOf(targetIndex)
  if (from < 0 || to < 0) return
  order.splice(from, 1)
  order.splice(to, 0, sourceIndex)
  rowOrder.value = order
}

const isLinked = (columnIndex: number) =>
  props.unitLinks.some((item) => item.param === columnIndex || item.unitParam === columnIndex)

const linkedLabel = (columnIndex: number) => {
  const link = props.unitLinks.find((item) => item.param === columnIndex || item.unitParam === columnIndex)
  if (!link || link.unitParam == null) return ''
  const paramName = props.columns.find((item) => item.index === link.param)?.name
  const unitName = props.columns.find((item) => item.index === link.unitParam)?.name
  return paramName && unitName ? `${paramName} ⇄ ${unitName}` : ''
}
</script>

<template>
  <div v-if="columns.length" class="column-mapping">
    <h4 class="column-mapping__title">Сопоставление колонок</h4>
    <ul class="column-mapping__list">
      <li
        v-for="col in orderedColumns"
        :key="col.index"
        class="column-mapping__row"
        :class="{
          'column-mapping__row--unit-unresolved': unresolvedUnitColumns.has(col.index),
          'column-mapping__row--linked': isLinked(col.index),
        }"
        draggable="true"
        @dragstart="onDragStart(col.index)"
        @dragover.prevent
        @drop="onDrop(col.index)"
      >
        <span class="column-mapping__name">{{ col.name }}</span>
        <DropBox
          :options="optionsForColumn(col.index).map((opt) => ({ value: opt.value, label: opt.labelRu ?? opt.label }))"
          :modelValue="modelValue[col.index] ?? ''"
          @update:modelValue="updateMapping(col.index, $event)"
        />
        <span
          v-if="modelValue[col.index] === PRODUCT_PARAM_TYPE"
          class="column-mapping__hint"
          title="Например: Вес"
        >i</span>
      </li>
    </ul>

    <p v-if="unresolvedUnitColumns.size > 0" class="column-mapping__warning">
      Перетащите строку с «ед.изм. параметра товара» на строку с «параметр товара», чтобы связать их.
    </p>

    <ul class="column-mapping__links">
      <li v-for="col in orderedColumns" :key="`link-${col.index}`">
        <span v-if="linkedLabel(col.index)">{{ linkedLabel(col.index) }}</span>
      </li>
    </ul>
  </div>
</template>
