<script setup lang="ts">
import "./Upload.css";
import { ref } from 'vue'
const emit = defineEmits(['response'])

const fileName = ref<string>();

const isCsv = (file: File): boolean => {
    fileName.value = file.name;
    return file.name.toLowerCase().endsWith('.csv')
}

const handleFileUpload = (event: Event): void => {
    const input = event.target as HTMLInputElement
    if (!input.files || !input.files.length) return

    const file = input.files[0]
    const reader = new FileReader()

    reader.onload = () => {
        const result = reader.result
        if (!result) return

        if (file && isCsv(file)) {
            const buffer = result as ArrayBuffer

            const decoder = new TextDecoder('utf-8')
            let text = decoder.decode(buffer)

            if (/Ð.|Ñ./.test(text)) {
                text = new TextDecoder('windows-1251').decode(buffer)
            }

            emit('response', { fileName: fileName, data: text, type: 'string' })
        } else {
            emit('response', { fileName: fileName, data: result as ArrayBuffer, type: 'array' })
        }
    }

    if (file) reader.readAsArrayBuffer(file)
    input.value = ''
}
</script>

<template>
    <div class="loader">
        <h2 class="loader__filename">{{ fileName || "Загрузка таблицы" }}</h2>
        <input class="loader__input" type="file" @change="handleFileUpload" accept=".xlsx,.xls,.csv"/>
    </div>
</template>
