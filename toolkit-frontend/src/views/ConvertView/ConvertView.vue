<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";

import Upload, { type NormalizedFile } from "@/components/Upload/Upload.vue";
import Table from "@/components/Table/Table.vue";
import XmlView from "@/components/XmlView/XmlView.vue";
import ExportButton from "@/components/ExportButton/ExportButton.vue";
import Button from "@/components/Button/Button.vue";

import { useConvertStore } from "@/stores/useConverter";
import "./ConvertView.css";

type TableData = (string | number | boolean | null)[][];

const store = useConvertStore();
const { inputFile } = storeToRefs(store);

const uploadedFile = ref<NormalizedFile | null>(null);

const onUpload = (file: NormalizedFile) => {
  uploadedFile.value = file;

  if (file.type === "xml") {
    inputFile.value.xml.data = file.data;
    return;
  }

  store.uploadTable(file.data);
};

const canConvert = computed(() =>
  Boolean(inputFile.value.table.data || inputFile.value.xml.data)
);

const convert = () => {
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
</script>

<template>
  <section class="convert">
    <div class="convert__wrapper">
      <Upload @upload="onUpload" :fileName="uploadedFile?.fileName" />

      <Table
        v-if="showSourceTable"
        :data="sourceTableData"
        v-on:update="(value) => inputFile.table.data = value"
      />

      <XmlView
        v-if="showSourceXml"
        :inputXml="inputFile.xml.data ?? ''"
        v-on:update="(value) => inputFile.xml.data = value"
      />

      <ExportButton
      class="convert__button"
        v-if="exportSourceFile"
        type="upload"
        :file="exportSourceFile"
      />
    </div>

    <Button
      class="convert__button convert__button--convert"
      :isDisabled="!canConvert"
      @click="convert"
    >
      Конвертировать
    </Button>

    <div class="convert__wrapper">
      <XmlView
        v-if="showResultXml"
        :inputXml="inputFile.xml.data ?? ''"
        v-on:update="(value) => inputFile.xml.data = value"
      />

      <Table
        v-if="showResultTable"
        :data="resultTableData"
        v-on:update="(value) => inputFile.table.data = value"
      />

      <ExportButton
      class="convert__button"
        v-if="exportResultFile"
        type="convert"
        :file="exportResultFile"
      />
    </div>
  </section>
</template>
