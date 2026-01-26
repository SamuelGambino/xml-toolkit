<script setup lang="ts">
import "./Table.css";
import "handsontable/styles/handsontable.css";
import "handsontable/styles/ht-theme-main.css";

import { HotTable } from "@handsontable/vue3";
import { registerAllModules } from "handsontable/registry";
import { ref, watch } from "vue";

registerAllModules();

type Table = (string | number | boolean | null)[][];

const props = defineProps<{
  data: Table | null;
}>();

const emit = defineEmits<{
  (e: "update", value: Table): void;
}>();

// локальная копия данных
const localData = ref<Table>(props.data ? JSON.parse(JSON.stringify(props.data)) : []);

// следим за props.data, чтобы обновить локальные данные только если они реально поменялись
watch(
  () => props.data,
  (newData) => {
    if (newData && JSON.stringify(newData) !== JSON.stringify(localData.value)) {
      localData.value = JSON.parse(JSON.stringify(newData));
    }
  },
  { deep: true }
);

// обработчик изменений Handsontable
watch(localData, (newVal) => {
  emit("update", JSON.parse(JSON.stringify(newVal)));
}, { deep: true });
</script>

<template>
  <div v-if="localData.length" class="table">
    <HotTable
      themeName="ht-theme-main-dark"
      :data="localData"
      rowHeaders
      colHeaders
      stretchH="all"
      search
      manualColumnMove
      manualColumnResize
      contextMenu
      autoWrapRow
      autoWrapCol
      licenseKey="non-commercial-and-evaluation"
    />
  </div>
</template>
