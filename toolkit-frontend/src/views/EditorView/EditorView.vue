<script setup lang="ts">
import "./EditorView.css";
import XmlView from "@/components/XmlView/XmlView.vue";
import ExportButton from "@/components/ExportButton/ExportButton.vue";
import Upload, { type NormalizedFile } from "@/components/Upload/Upload.vue";
import SearchBar from "@/components/SearchBar/SearchBar.vue";
import Button from "@/components/Button/Button.vue";
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useXmlEditorStore } from "@/stores/useXmlEditor";
import SchemaXml from "@/components/SchemaXml/SchemaXml.vue";

const searchReq = ref<{
  req: string,
  regx: boolean,
} | null>(null);
const search = ref();
const uploadedFile = ref<NormalizedFile | null>(null);
const { loadXml, parseXml, generateSchema } = useXmlEditorStore();
const { schema, sourceXml } = storeToRefs(useXmlEditorStore());
const xmlViewRef = ref<InstanceType<typeof XmlView>>();

// function onSchemaClick(range: XmlRange) {
//   xmlViewRef.value?.highlightRange(range);
// };

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
      <div class="editor__tools">
        <SearchBar v-model="search" :debounce="300" />
        <Button class="editor__btn" :isDisabled="sourceXml ? false : true">test</Button>
      </div>
      <div class="editor__wrapper editor__wrapper--border">
        <SchemaXml v-if="schema" :meta="schema" v-on:search-req="(req) => {
          searchReq = req;
          console.log('Сработал emit, с данными: ' + req);
          }" />
      </div>
    </div>

    <div class="editor__wrapper editor__wrapper--border editor__wrapper--document">
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
