<script setup lang="ts">
import Table from "@/components/Table/Table.vue";
import Button from "@/components/Button/Button.vue";
import Tools from "@/components/Tools/Tools.vue";
import Upload from "@/components/Upload/Upload.vue";
import "./ConvertView.css";
import { computed, ref, watch } from "vue";
import { useFileStore } from '@/stores/file';
import ExportButton from "@/components/ExportButton/ExportButton.vue";
import { storeToRefs } from "pinia";
import XmlView from "@/components/XmlView/XmlView.vue";

const { convertTableToXml, convertXmlToTable } = useFileStore();
const { inputFile } = storeToRefs(useFileStore());

const convert = () => {
  if(inputFile.value.type !== "xml") {
    convertTableToXml(inputFile.value);
  } else {
    convertXmlToTable(inputFile.value);
  }
}
</script>

<template>
  <section class="convert">
    <div class="convert__wrapper">
      <Upload />
      <Table v-if="inputFile.type !== 'xml'" />
      <XmlView v-if="inputFile.type === 'xml'" />
      <ExportButton class="convert__button" v-if="inputFile.raw" type="upload" />
    </div>

    <Button class="convert__button--convert" @click="convert" :isDisabled="inputFile.raw ? false : true">Конвертировать</Button>

    <div class="convert__wrapper">
      <XmlView v-if="inputFile.convertResult?.xml" />
      <Table v-if="inputFile.convertResult?.csv" />
      <ExportButton class="convert__button" v-if="inputFile.convertResult?.xml ||inputFile.convertResult?.csv" type="convert" />
    </div>
  </section>
</template>
