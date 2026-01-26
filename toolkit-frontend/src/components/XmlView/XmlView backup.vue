<script setup lang="ts">
import { ref, watch } from "vue";
import MonacoEditor from "@guolao/vue-monaco-editor";
import type * as monaco from "monaco-editor";

interface XmlRange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

const props = defineProps<{
  inputXml: string;
  range?: XmlRange | null;
}>();

const emit = defineEmits<{
  (e: "update", value: string): void;
}>();

const lastRange = ref<XmlRange | null>(null);
const value = ref(props.inputXml);
const editor = ref<monaco.editor.IStandaloneCodeEditor | null>(null);

watch(() => props.inputXml, (v) => {
  if (v !== value.value) value.value = v;
});

const onChange = (val: string) => {
  value.value = val;
  // emit("update", val);
};

const handleMount = (
  _editor: monaco.editor.IStandaloneCodeEditor
) => {
  editor.value = _editor;
};

function isSameRange(a: XmlRange, b: XmlRange) {
  return (
    a.startLine === b.startLine &&
    a.startColumn === b.startColumn &&
    a.endLine === b.endLine &&
    a.endColumn === b.endColumn
  );
}


watch(
  () => props.range,
  (range) => {
    console.log("range update");
    if (!range || !editor.value) return;

    // 🔑 защита от зацикливания
    if (lastRange.value && isSameRange(lastRange.value, range)) {
      return;
    }

    lastRange.value = range;

    // editor.value.revealLineInCenter(range.startLine);

    editor.value.setSelection({
      startLineNumber: range.startLine,
      startColumn: range.startColumn,
      endLineNumber: range.endLine,
      endColumn: range.endColumn
    });

    editor.value.focus();
  }
);
</script>

<template>
  <!-- <MonacoEditor
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
    @mount="handleMount"
  /> -->
  <MonacoEditor
    v-model:value="value"
    language="xml"
    theme="vs-dark"
    :options="{
      wordWrap: 'off',
      minimap: { enabled: false },
      automaticLayout: true
    }"
    @change="onChange"
    @mount="handleMount"
  />
</template>
