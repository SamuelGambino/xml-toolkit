<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import MonacoEditor from "@guolao/vue-monaco-editor";

interface XmlRange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

const props = defineProps<{
  inputXml: string;
}>();

const emit = defineEmits<{
  (e: "update", value: string): void;
}>();

const editorRef = ref<any>(null);
const value = ref(props.inputXml);

watch(() => props.inputXml, (v) => {
  if (v !== value.value) value.value = v;
});

const onChange = (val: string) => {
  value.value = val;
  emit("update", val);
};
</script>

<template>
  <MonacoEditor
    v-model:value="value"
    language="xml"
    theme="vs-dark"
    :options="{
      minimap: { enabled: false },
      wordWrap: 'on',
      fontSize: 13,
      automaticLayout: true
    }"
    @change="onChange"
    ref="editorRef"
  />
</template>