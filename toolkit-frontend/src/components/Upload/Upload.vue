<script setup lang="ts">
import "./Upload.css";
import { ref } from 'vue'
import { useFileStore } from '@/stores/file';
import { storeToRefs } from "pinia";

const { inputFile } = storeToRefs(useFileStore());

const isCsv = (file: File): boolean => {
    return file.name.toLowerCase().endsWith('.csv')
}

const isXml = (file: File) =>
    file.name.toLowerCase().endsWith(".xml");

const handleFileUpload = (event: Event): void => {
    const input = event.target as HTMLInputElement
    if (!input.files || !input.files.length) return

    const file = input.files[0]
    inputFile.value.fileName = file?.name || "";

    const reader = new FileReader()

    reader.onload = () => {
        const result = reader.result;
        if (!result) return;

        if (file && isXml(file)) {
            inputFile.value = {
                fileName: file.name,
                raw: result as string,
                table: null,
                type: "xml",
            };
            return;
        }

        if (file && isCsv(file)) {
            const buffer = result as ArrayBuffer;
            let text = new TextDecoder("utf-8").decode(buffer);

            if (/Ð.|Ñ./.test(text)) {
                text = new TextDecoder("windows-1251").decode(buffer);
            }

            inputFile.value = {
                fileName: file.name,
                raw: text,
                table: null,
                type: "string",
            };
            return; // ← ОБЯЗАТЕЛЬНО
        }

        // XLS / XLSX
        if (file) {
            inputFile.value = {
                fileName: file.name,
                raw: result as ArrayBuffer,
                table: null,
                type: "array",
            };
        };
    };

    if (file && isXml(file)) {
        reader.readAsText(file);
    } else if (file) {
        reader.readAsArrayBuffer(file);
    }

    input.value = ''
}
</script>

<template>
    <div class="uploader">
        <h2 class="uploader__filename">{{ inputFile.fileName || "Загрузка файла" }}</h2>
        <input class="uploader__input" type="file" @change="handleFileUpload" accept=".xlsx,.xls,.csv,.xml" />
    </div>
</template>
