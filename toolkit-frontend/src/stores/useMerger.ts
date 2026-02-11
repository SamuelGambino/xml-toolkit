import { defineStore } from "pinia";
import { ref } from "vue";

export const useMergerStore = defineStore("merger", () => {
  const targetFile = ref<string | null>(null);
  const sourceFile = ref<string | null>(null);
  const resultFile = ref<string | null>(null);
  const isLoading = ref<boolean>(false);
  const isSwitchingAnimate = ref<boolean>(false);

  const uploadFile = (xml: string, fileType: "target" | "source") => {
    if (fileType === "target") {
      targetFile.value = xml;
      sourceFile.value = sourceFile.value ?? null;
      resultFile.value = null;
    };
    if (fileType === "source") {
      targetFile.value = targetFile.value ?? null;
      sourceFile.value = xml;
      resultFile.value = null;
    };
  };

  const resetState = () => {
    targetFile.value = null;
    sourceFile.value = null;
    resultFile.value = null;
  }

  const testMerge = () => {
    resultFile.value = targetFile.value;
  };

  const switchFiles = () => {
    isSwitchingAnimate.value = true;
  }

  return {
    targetFile,
    sourceFile,
    resultFile,
    uploadFile,
    resetState,
    testMerge,
    switchFiles
  }
});