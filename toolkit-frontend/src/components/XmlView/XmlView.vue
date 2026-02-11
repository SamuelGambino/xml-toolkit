<script setup lang="ts">
import { ref, watch } from "vue";
import MonacoEditor from "@guolao/vue-monaco-editor";

const props = defineProps<{
  inputXml: string;
  searchReq?: {
    req: string,
    regx: boolean,
  } | null;
}>();

const emit = defineEmits<{
  (e: "update", value: string): void;
}>();

const value = ref(props.inputXml);
const editor = ref<any>(null);

watch(() => props.inputXml, (v) => {
  if (v !== value.value) value.value = v;
});

const onMount = (editorInstance: any) => {
  editor.value = editorInstance;
};

let lastQuery = '';

watch(
  () => props.searchReq,
  async (query) => {
    if (!query || query.req === lastQuery) return;

    lastQuery = query.req;
    const ed = editor.value;

    ed.focus();

    await ed.getAction('editor.action.startFindReplaceAction').run();

    const controller = ed.getContribution('editor.contrib.findController');
    if (!controller) return;

    const state = controller.getState();
    if (!state) return;

    state.change(
      {
        searchString: query.req,
        isRegex: query.regx,
        matchCase: false,
        wholeWord: false,
        preserveCase: false
      },
      false
    );

    queueMicrotask(() => {
      editor.value?.focus();
    });
  }
);

const onChange = (val: string) => {
  value.value = val;
  emit("update", val);
};
</script>

<template>
  <MonacoEditor v-model:value="value" language="xml" theme="vs-dark" :options="{
    minimap: { enabled: false },
    wordWrap: 'on',
    fontSize: 13,
    automaticLayout: true
  }" @change="onChange" @mount="onMount" />
</template>
