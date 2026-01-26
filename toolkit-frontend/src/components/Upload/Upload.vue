<script setup lang="ts">
import "./Upload.css";
import { computed } from "vue";

export type NormalizedFile =
  | {
      type: "xml";
      fileName: string;
      data: string;
    }
  | {
      type: "csv";
      fileName: string;
      data: string;
    }
  | {
      type: "array";
      fileName: string;
      data: ArrayBuffer;
    };

const props = defineProps<{
  only?: "xml" | "table";
  fileName?: string;
}>();

const emit = defineEmits<{
  (e: "upload", file: NormalizedFile): void;
}>();

const accept = computed(() => {
  if (!props.only) return ".xlsx,.xls,.csv,.xml";
  if (props.only === "xml") return ".xml";
  if (props.only === "table") return ".xlsx,.xls,.csv";
  return "";
});

const isXml = (file: File) =>
  file.name.toLowerCase().endsWith(".xml");

const isCsv = (file: File) =>
  file.name.toLowerCase().endsWith(".csv");

const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const file = input.files[0];
  if(!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    if (!reader.result) return;

    /** XML */
    if (isXml(file)) {
      emit("upload", {
        type: "xml",
        fileName: file.name,
        data: reader.result as string,
      });
      return;
    }

    if (isCsv(file)) {
      const buffer = reader.result as ArrayBuffer;
      let text = new TextDecoder("utf-8").decode(buffer);

      if (/Ð.|Ñ./.test(text)) {
        text = new TextDecoder("windows-1251").decode(buffer);
      }

      emit("upload", {
        type: "csv",
        fileName: file.name,
        data: text,
      });
      return;
    }

    emit("upload", {
      type: "array",
      fileName: file.name,
      data: reader.result as ArrayBuffer,
    });
  };

  if (isXml(file)) {
    reader.readAsText(file);
  } else {
    reader.readAsArrayBuffer(file);
  }

  input.value = "";
};
</script>

<template>
  <div class="uploader">
    <input
      class="uploader__input"
      type="file"
      :accept="accept"
      @change="handleFileUpload"
    >{{ props.fileName ? props.fileName : "Выберите или перетащите файл" }}</input>
  </div>
</template>
