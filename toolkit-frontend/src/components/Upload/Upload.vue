<script setup lang="ts">
import "./Upload.css";
import { computed } from "vue";

export type NormalizedFile =
  | {
      type: "xml";
      fileName: string;
      data: string;
      file?: File;
    }
  | {
      type: "csv";
      fileName: string;
      data: string;
      file?: File;
    }
  | {
      type: "array";
      fileName: string;
      data: ArrayBuffer;
      file?: File;
    };

const props = withDefaults(
  defineProps<{
    only?: "xml" | "table";
    fileName?: string;
    /** Max file size in megabytes (e.g. 20 for 20MB). No limit if not set. */
    maxSize?: number;
  }>(),
  { maxSize: undefined }
);

const emit = defineEmits<{
  (e: "upload", file: NormalizedFile): void;
  (e: "error", message: string): void;
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
  if (!file) return;

  if (props.maxSize != null && props.maxSize > 0) {
    const maxBytes = props.maxSize * 1024 * 1024;
    if (file.size > maxBytes) {
      emit("error", `Файл превышает допустимый размер (макс. ${props.maxSize} МБ)`);
      input.value = "";
      return;
    }
  }

  const reader = new FileReader();

  reader.onload = () => {
    if (!reader.result) return;

    /** XML */
    if (isXml(file)) {
      emit("upload", {
        type: "xml",
        fileName: file.name,
        data: reader.result as string,
        file,
      });
      return;
    }

    if (isCsv(file)) {
      const buffer = reader.result as ArrayBuffer;
      const utf8Text = new TextDecoder("utf-8").decode(buffer);
      const win1251Text = new TextDecoder("windows-1251").decode(buffer);

      // Mojibake: UTF-8 bytes read as Latin-1 produce Ð, Ñ etc. Prefer Windows-1251 if UTF-8 looks like mojibake.
      const looksLikeMojibake = /Ð[^\s]|Ñ[^\s]/.test(utf8Text) && !/[а-яА-ЯёЁ]/.test(utf8Text);
      const text = looksLikeMojibake ? win1251Text : utf8Text;

      emit("upload", {
        type: "csv",
        fileName: file.name,
        data: text,
        file,
      });
      return;
    }

    emit("upload", {
      type: "array",
      fileName: file.name,
      data: reader.result as ArrayBuffer,
      file,
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
