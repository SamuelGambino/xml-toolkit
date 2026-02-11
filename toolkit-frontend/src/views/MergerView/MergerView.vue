<script setup lang="ts">
import "./MergerView.css";
import { useMergerStore } from "@/stores/useMerger";

import Upload, { type NormalizedFile } from "@/components/Upload/Upload.vue";
import XmlView from "@/components/XmlView/XmlView.vue";
import ExportButton from "@/components/ExportButton/ExportButton.vue";
import Button from "@/components/Button/Button.vue";
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";

const { uploadFile, testMerge } = useMergerStore();
const { targetFile, sourceFile, resultFile } = storeToRefs(useMergerStore());

const targetFileName = ref<string | null>(null);
const sourceFileName = ref<string | null>(null);

const onUpload = (file: NormalizedFile, fileType: "target" | "source") => {
  if (typeof (file.data) !== 'string' || !file.data || file.data === "") return;
  if (fileType === 'target') targetFileName.value = file.fileName;
  if (fileType === 'source') sourceFileName.value = file.fileName;
  uploadFile(file.data, fileType);
}
</script>

<template>
  <section class="merger">
    <div class="merger__wrapper">
      <div class="merger__file">
        <Upload @upload="(file) => onUpload(file, 'target')" :fileName="targetFileName ?? undefined" />

        <XmlView v-if="targetFile" :inputXml="targetFile ?? ''" v-on:update="(value) => targetFile = value" />

        <ExportButton class="merger__button" v-if="targetFile" type="upload"
          :file="{ rawFileName: targetFileName ?? '', type: 'xml', data: targetFile }" />
      </div>

      <Button class="merger__button merger__button--convert" @click="testMerge">
        Merge
      </Button>

      <div class="merger__file">
        <Upload @upload="(file) => onUpload(file, 'source')" :fileName="sourceFileName ?? undefined" />

        <XmlView v-if="sourceFile" :inputXml="sourceFile ?? ''" v-on:update="(value) => sourceFile = value" />

        <ExportButton class="merger__button" v-if="sourceFile"
          :file="{ rawFileName: sourceFileName ?? '', type: 'xml', data: sourceFile }" />
      </div>
    </div>

    <div class="merger__wrapper merger__wrapper--result">
      <div v-if="resultFile" class="merger__result">
        <XmlView :inputXml="resultFile ?? ''" v-on:update="(value) => resultFile = value" />

        <ExportButton class="merger__button"
          :file="{ rawFileName: targetFileName ? targetFileName + '--new' : '', type: 'xml', data: targetFile }" />
      </div>
    </div>
  </section>
</template>
