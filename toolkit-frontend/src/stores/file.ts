import { defineStore } from "pinia";
import { ref } from "vue";

export interface IInputFile {
  type: "array" | "string" | "xml" | null;
  fileName: string | null;

  /** Исходное содержимое файла */
  raw: ArrayBuffer | string | null;

  /** Данные таблицы (ТОЛЬКО для Handsontable и Excel-экспорта) */
  table: any[][] | null;
}

export const useFileStore = defineStore("file", () => {
  const inputFile = ref<IInputFile>({
    type: null,
    fileName: null,
    raw: null,
    table: null,
  });

  return { inputFile };
});
