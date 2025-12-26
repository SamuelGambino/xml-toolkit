<script setup lang="ts">
import "./Table.css";
import { ref, watch } from 'vue'
import * as XLSX from 'xlsx'
import { HotTable } from '@handsontable/vue3'
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import { saveAs } from 'file-saver';
import { useFileStore } from '@/stores/file';
import { storeToRefs } from "pinia";

const { inputFile } = storeToRefs(useFileStore());
const tableKey = ref(0)

registerAllModules();

const parseWorkbook = (data: ArrayBuffer | string, type: 'array' | 'string') => {
  const workbook = XLSX.read(data, { type })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return

  const worksheet = workbook.Sheets[sheetName]
  if (!worksheet || !worksheet['!ref']) return

  const range = XLSX.utils.decode_range(worksheet['!ref'])
  worksheet['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: range.e
  })

  inputFile.value.table = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: null,
  });

  tableKey.value++
}

watch(
  () => inputFile.value,
  (file) => {
    if (!file) return;

    if (
      (file.type === "array" || file.type === "string") &&
      file.raw
    ) {
      parseWorkbook(file.raw, file.type);
    }
  }
);
</script>

<template>
  <div v-if="inputFile.table" class="table">
    <HotTable :key="tableKey" :themeName="'ht-theme-main-dark'"
      :data="inputFile.table ? inputFile.table : inputFile.raw" :rowHeaders="true" :colHeaders="true" :stretchH="'all'"
      :search="true" :manualColumnMove="true" :manualColumnResize="true" :contextMenu="true" :autoWrapRow="true"
      :autoWrapCol="true" licenseKey="non-commercial-and-evaluation" />
  </div>
</template>
