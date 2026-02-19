<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";

import Upload, { type NormalizedFile } from "@/components/Upload/Upload.vue";
import Table from "@/components/Table/Table.vue";
import XmlView from "@/components/XmlView/XmlView.vue";
import ExportButton from "@/components/ExportButton/ExportButton.vue";
import Button from "@/components/Button/Button.vue";
import ColumnMapping from "@/components/ColumnMapping/ColumnMapping.vue";

import { useConvertStore, getColumnNames } from "@/stores/useConverter";
import "./ConvertView.css";

type TableData = (string | number | boolean | null)[][];

const store = useConvertStore();
const { inputFile, actualConfig } = storeToRefs(store);

const uploadedFile = ref<NormalizedFile | null>(null);
const columnMappings = ref<Record<number, string>>({});
const convertError = ref<string | null>(null);
const convertLoading = ref(false);

const onUpload = async (file: NormalizedFile) => {
  uploadedFile.value = file;
  columnMappings.value = {};
  convertError.value = null;
  inputFile.value.backendResult = null;

  if (file.type === "xml") {
    inputFile.value.xml.data = file.data;
    inputFile.value.xml.isConvertRes = false;
    return;
  }

  // For CSV files, we need to convert the string back to ArrayBuffer for tableLoader
  if (file.type === "csv") {
    const encoder = new TextEncoder();
    const buffer = encoder.encode(file.data);
    store.uploadTable(buffer);
  } else {
    store.uploadTable(file.data);
  }
};

const columns = computed(() =>
  getColumnNames(inputFile.value.table.data)
);

const supportedTypes = computed(() =>
  actualConfig.value?.supportedColumnTypes ?? []
);

const canConvert = computed(() =>
  Boolean(inputFile.value.table.data || inputFile.value.xml.data)
);

const mappingsForBackend = computed(() => {
  const arr: { columnIndex: number; columnName: string; columnType: string }[] = [];
  columns.value.forEach((col) => {
    const t = columnMappings.value[col.index];
    if (t) arr.push({ columnIndex: col.index, columnName: col.name, columnType: t });
  });
  return arr;
});

const canConvertViaBackend = computed(
  () =>
    Boolean(
      inputFile.value.table.data &&
        uploadedFile.value &&
        "file" in uploadedFile.value &&
        uploadedFile.value.file &&
        mappingsForBackend.value.length > 0
    )
);

const convert = async () => {
  convertError.value = null;
  
  // Use backend conversion if table is loaded and mappings are provided
  if (inputFile.value.table.data && canConvertViaBackend.value) {
    const file = (uploadedFile.value as NormalizedFile & { file?: File }).file;
    if (!file) {
      convertError.value = "Файл не найден";
      return;
    }
    
    convertLoading.value = true;
    try {
      console.log("Sending to backend:", { fileName: file.name, mappings: mappingsForBackend.value });
      const res = await store.convertTableViaBackend(file, mappingsForBackend.value);
      console.log("Backend response:", res);
      
      if (!res.success) {
        convertError.value = res.error ?? "Ошибка конвертации";
      } else {
        console.log("Conversion successful, result:", inputFile.value.backendResult);
      }
    } catch (e: unknown) {
      console.error("Convert error:", e);
      convertError.value = e instanceof Error ? e.message : "Ошибка запроса";
    } finally {
      convertLoading.value = false;
    }
    return;
  }
  
  // Fallback to local conversion
  if (inputFile.value.table.data) {
    store.convertTableToXml();
  } else if (inputFile.value.xml.data) {
    store.convertXmlToTable();
  }
};

const showSourceTable = computed(
  () => inputFile.value.table.data && inputFile.value.table.isConvertRes !== true
);

const showSourceXml = computed(
  () => inputFile.value.xml.data && inputFile.value.xml.isConvertRes !== true
);

const showResultTable = computed(
  () => inputFile.value.table.data && inputFile.value.table.isConvertRes === true
);

const showResultXml = computed(
  () => inputFile.value.xml.data && inputFile.value.xml.isConvertRes === true
);

const exportSourceFile = computed(() => {
  if (!uploadedFile.value) return null;

  return {
    rawFileName: uploadedFile.value.fileName,
    type: uploadedFile.value.type,
    data: inputFile.value.table.isConvertRes
      ? inputFile.value.xml.data
      : inputFile.value.table.data,
  };
});

const exportResultFile = computed(() => {
  if (!uploadedFile.value) return null;
  const type: "csv" | "xml" | "array" | null = uploadedFile.value.type === "xml" ? "csv" : "xml";

  return {
    rawFileName: uploadedFile.value.fileName,
    type,
    data: inputFile.value.table.isConvertRes
      ? inputFile.value.table.data
      : inputFile.value.xml.data,
  };
});

const sourceTableData = computed(() => (
  inputFile.value.table.data as TableData | null
));

const resultTableData = computed(() => (
  inputFile.value.table.data as TableData | null
));

onMounted(() => {
  store.getConfig();
});
</script>

<template>
  <section class="convert">
    <div class="convert__wrapper">
      <Upload @upload="onUpload" :fileName="uploadedFile?.fileName" />

      <Table v-if="showSourceTable" :data="sourceTableData" v-on:update="(value) => inputFile.table.data = value" />

      <XmlView v-if="showSourceXml" :inputXml="inputFile.xml.data ?? ''"
        v-on:update="(value) => inputFile.xml.data = value" />

      <ExportButton class="convert__button" v-if="exportSourceFile" type="upload" :file="exportSourceFile" />
    </div>

    <div class="convert__wrapper">
      <Button
        class="convert__button convert__button--convert"
        :isDisabled="!canConvert || convertLoading"
        :isLoading="convertLoading"
        @click="convert"
      >
        Конвертировать
      </Button>
      <ColumnMapping
        v-if="showSourceTable && columns.length > 0 && supportedTypes.length > 0"
        :columns="columns"
        :supported-types="supportedTypes"
        v-model="columnMappings"
      />
      <p v-if="convertError" class="convert__error">{{ convertError }}</p>
    </div>

    <div class="convert__wrapper">
      <XmlView v-if="showResultXml" :inputXml="inputFile.xml.data ?? ''"
        v-on:update="(value) => inputFile.xml.data = value" />

      <Table v-if="showResultTable" :data="resultTableData" v-on:update="(value) => inputFile.table.data = value" />

      <ExportButton class="convert__button" v-if="exportResultFile" type="convert" :file="exportResultFile" />
    </div>
  </section>
</template>
