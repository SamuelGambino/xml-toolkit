<script setup lang="ts">
import { computed } from "vue";
import type { IConfigColumnType } from "@/stores/useConverter";
import "./ColumnMapping.css";

const props = defineProps<{
  columns: { index: number; name: string }[];
  supportedTypes: IConfigColumnType[];
  modelValue: Record<number, string>;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: Record<number, string>): void;
}>();

const emptyOption = { value: "", labelRu: "Не выбрано" };

const options = computed(() => [emptyOption, ...props.supportedTypes]);

const updateMapping = (columnIndex: number, columnType: string) => {
  const next = { ...props.modelValue };
  if (columnType) {
    next[columnIndex] = columnType;
  } else {
    delete next[columnIndex];
  }
  emit("update:modelValue", next);
};
</script>

<template>
  <div v-if="columns.length" class="column-mapping">
    <h4 class="column-mapping__title">Сопоставление колонок</h4>
    <ul class="column-mapping__list">
      <li v-for="col in columns" :key="col.index" class="column-mapping__row">
        <span class="column-mapping__name">{{ col.name }}</span>
        <select
          class="column-mapping__select"
          :value="modelValue[col.index] ?? ''"
          @change="updateMapping(col.index, ($event.target as HTMLSelectElement).value)"
        >
          <option
            v-for="opt in options"
            :key="opt.value || 'empty'"
            :value="opt.value"
          >
            {{ opt.labelRu ?? opt.label }}
          </option>
        </select>
      </li>
    </ul>
  </div>
</template>
