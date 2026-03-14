<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { DnDProvider } from '@vue-dnd-kit/core'
import type { IConfigColumnType } from '@/stores/useConverter'
import './ColumnMapping.css'
import ColumnMappingRow from './ColumnMappingRow.vue'

const props = defineProps<{
  columns: { index: number; name: string }[]
  supportedTypes: IConfigColumnType[]
  modelValue: Record<number, string>
  characteristicLinks?: Record<number, number>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<number, string>): void
  (e: 'update:characteristicLinks', value: Record<number, number>): void
}>()

const PRODUCT_CHARACTERISTIC = 'ProductParameterCharacteristic'
const PRODUCT_CHARACTERISTIC_UNIT = 'ProductParameterCharacteristicUnit'

const emptyOption = { value: '', labelRu: 'Не выбрано', label: 'Не выбрано' }

const options = computed(() =>
  [emptyOption, ...props.supportedTypes].map((opt) => ({ value: opt.value, label: opt.labelRu ?? opt.label }))
)

const rowOrder = ref<number[]>([])

watch(
  () => props.columns,
  (cols) => {
    const nextIndices = cols.map((col) => col.index)
    const preserved = rowOrder.value.filter((index) => nextIndices.includes(index))
    const appended = nextIndices.filter((index) => !preserved.includes(index))
    rowOrder.value = [...preserved, ...appended]
  },
  { immediate: true, deep: true }
)

const orderedColumns = computed(() => {
  const columnByIndex = new Map(props.columns.map((col) => [col.index, col]))
  return rowOrder.value
    .map((index) => columnByIndex.get(index))
    .filter((col): col is { index: number; name: string } => Boolean(col))
})

const updateMapping = (columnIndex: number, columnType: string) => {
  const next = { ...props.modelValue }
  if (columnType) {
    next[columnIndex] = columnType
  } else {
    delete next[columnIndex]
  }
  emit('update:modelValue', next)
}

const pairsState = computed(() => {
  const used = new Set<number>()
  const pairs: Array<{ characteristicIndex: number; unitIndex: number }> = []
  const unitRows: number[] = []

  rowOrder.value.forEach((index) => {
    if (props.modelValue[index] === PRODUCT_CHARACTERISTIC_UNIT) {
      unitRows.push(index)
    }
  })

  for (let i = 0; i < rowOrder.value.length - 1; i += 1) {
    const first = rowOrder.value[i]
    const second = rowOrder.value[i + 1]
    if (first === undefined || second === undefined) continue
    if (used.has(first) || used.has(second)) continue

    const firstType = props.modelValue[first]
    const secondType = props.modelValue[second]

    const isPair =
      (firstType === PRODUCT_CHARACTERISTIC && secondType === PRODUCT_CHARACTERISTIC_UNIT) ||
      (firstType === PRODUCT_CHARACTERISTIC_UNIT && secondType === PRODUCT_CHARACTERISTIC)

    if (!isPair) continue

    const characteristicIndex = firstType === PRODUCT_CHARACTERISTIC ? first : second
    const unitIndex = firstType === PRODUCT_CHARACTERISTIC_UNIT ? first : second

    pairs.push({ characteristicIndex, unitIndex })
    used.add(first)
    used.add(second)
  }

  const pairedUnits = new Set(pairs.map((pair) => pair.unitIndex))
  const hasUnpairedUnit = unitRows.some((unit) => !pairedUnits.has(unit))

  return {
    pairs,
    hasUnpairedUnit,
  }
})

watch(
  pairsState,
  (state) => {
    const links: Record<number, number> = {}
    state.pairs.forEach((pair) => {
      links[pair.characteristicIndex] = pair.unitIndex
    })
    emit('update:characteristicLinks', links)
  },
  { immediate: true }
)

const pairedCharacteristics = computed(
  () => new Set(pairsState.value.pairs.map((pair) => pair.characteristicIndex))
)
const pairedUnits = computed(() => new Set(pairsState.value.pairs.map((pair) => pair.unitIndex)))

const rowClass = (columnIndex: number): string[] => {
  const classes: string[] = []
  const type = props.modelValue[columnIndex]

  if (!pairsState.value.hasUnpairedUnit) return classes

  if (type === PRODUCT_CHARACTERISTIC) {
    classes.push('column-mapping__row--characteristic')
    classes.push(
      pairedCharacteristics.value.has(columnIndex)
        ? 'column-mapping__row--characteristic-paired'
        : 'column-mapping__row--characteristic-pending'
    )
  }

  if (type === PRODUCT_CHARACTERISTIC_UNIT) {
    classes.push('column-mapping__row--unit')
    classes.push(
      pairedUnits.value.has(columnIndex)
        ? 'column-mapping__row--unit-paired'
        : 'column-mapping__row--unit-pending'
    )
  }

  return classes
}

const updateOrder = (next: number[]) => {
  rowOrder.value = next
}
</script>

<template>
  <div v-if="columns.length" class="column-mapping">
    <h4 class="column-mapping__title">Сопоставление колонок</h4>
    <DnDProvider>
      <ul class="column-mapping__list">
        <ColumnMappingRow
          v-for="(col, position) in orderedColumns"
          :key="col.index"
          :column="col"
          :order="rowOrder"
          :position="position"
          :mapped-type="modelValue[col.index] ?? ''"
          :options="options"
          :class-name="rowClass(col.index).join(' ')"
          @update:mappedType="updateMapping(col.index, $event)"
          @reorder="updateOrder"
        />
      </ul>
    </DnDProvider>
  </div>
</template>
