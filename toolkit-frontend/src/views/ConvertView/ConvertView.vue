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

const { inputFile } = storeToRefs(useFileStore());

const isDisabled = ref<boolean>(true);
</script>

<template>
  <section class="convert">
    <div class="convert__wrapper">
      <Upload />
      <Table v-if="inputFile.type !== 'xml'" />
      <!-- <Table v-if="!inputFile.value.table.length && inputFile.value.raw.length" /> -->
      <ExportButton class="convert__button" v-if="inputFile" />
    </div>

    <Tools>
      <Button :isDisabled="isDisabled">Конвертировать</Button>
    </Tools>
    <div class="convert__xml"></div>
  </section>
</template>
