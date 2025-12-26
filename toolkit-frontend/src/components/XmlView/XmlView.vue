<script setup lang="ts">
import "./XmlView.css";
import { computed, watch } from "vue";
import { useFileStore } from "@/stores/file";
import { storeToRefs } from "pinia";

const { inputFile } = storeToRefs(useFileStore())

const formatXml = (xml: string): string => {
  const PADDING = '  '; // 2 пробела
  const reg = /(>)(<)(\/*)/g;

  let formatted = '';
  let pad = 0;

  xml
    .replace(reg, '$1\n$2$3')
    .split('\n')
    .forEach((node) => {
      if (node.match(/^<\/\w/)) {
        pad--;
      }

      formatted += PADDING.repeat(pad) + node + '\n';

      if (node.match(/^<\w[^>]*[^/]>$/)) {
        pad++;
      }
    });

  return formatted.trim();
}

const xml = computed<string>({
  get() {
    if (inputFile.value.convertResult?.xml) {
      return inputFile.value.convertResult.xml;
    }

    if (typeof inputFile.value.raw === "string") {
      try {
        return formatXml(inputFile.value.raw);
      } catch {
        return inputFile.value.raw;
      }
    }

    return "";
  },

  set(value: string) {
    if (inputFile.value.convertResult) {
      inputFile.value.convertResult.xml = value;
      return;
    }

    // fallback — редактирование исходного xml
    inputFile.value.raw = value;
  },
});
</script>

<template>
  <textarea v-model="xml" spellcheck="false" class="xml-editor"></textarea>
</template>
