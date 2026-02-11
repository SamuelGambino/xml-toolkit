<script setup lang="ts">
import "./EditorView.css";
import XmlView from "@/components/XmlView/XmlView.vue";
import ExportButton from "@/components/ExportButton/ExportButton.vue";
import Upload, { type NormalizedFile } from "@/components/Upload/Upload.vue";
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useXmlEditorStore } from "@/stores/useXmlEditor";
import SchemaXml from "@/components/SchemaXml/SchemaXml.vue";

const searchReq = ref<{
  req: string,
  regx: boolean,
} | null>(null);
const uploadedFile = ref<NormalizedFile | null>(null);
const { loadXml, parseXml, generateSchema } = useXmlEditorStore();
const { schema, sourceXml } = storeToRefs(useXmlEditorStore());

const onUpload = (file: NormalizedFile) => {
  if (typeof file.data !== "string") return;
  uploadedFile.value = file;
  loadXml(file.data);
  parseXml();
  generateSchema();
};

const exportFile = computed(() => {
  const type: "csv" | "xml" | "array" = "xml";

  return {
    rawFileName: uploadedFile.value?.fileName ?? "newXml.xml",
    type,
    data: sourceXml.value,
  };
});
</script>

<template>
  <section class="editor">
    <div class="editor__wrapper">
      <SchemaXml v-if="schema" :meta="schema" v-on:search-req="(req) => {
        searchReq = req;
        console.log('Сработал emit, с данными: ' + req);
      }" />
    </div>

    <div class="editor__wrapper editor__wrapper--document">
      <Upload @upload="onUpload" :fileName="uploadedFile?.fileName" only="xml" />
      <XmlView v-if="sourceXml" :searchReq="searchReq" :inputXml="sourceXml ?? ''" v-on:update="(value) => {
        sourceXml = value;
        parseXml();
        generateSchema();
      }" />
      <ExportButton v-if="sourceXml" class="editor__btn-export" type="upload" :file="exportFile" />
    </div>
  </section>
</template>
