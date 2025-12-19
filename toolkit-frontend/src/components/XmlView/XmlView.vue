<script setup lang="ts">
import "./Table.css";
import { ref, watch } from 'vue'
import * as XLSX from 'xlsx'
import { HotTable } from '@handsontable/vue3'
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import { saveAs } from 'file-saver'
import Upload from "../Upload/Upload.vue";

interface IInputFile {
    fileName: string,
    data: ArrayBuffer,
    type: 'array' | 'string'
}

const hotData = ref<(string | number | boolean | null)[][]>([])
const tableData = ref<IInputFile>();
const tableKey = ref(0)

registerAllModules();

const parseWorkbook = (data: ArrayBuffer | string, type: 'array' | 'string') => {
    const workbook = XLSX.read(data, { type })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) return

    const worksheet = workbook.Sheets[sheetName]
    if (!worksheet || !worksheet['!ref']) return

    const range = XLSX.utils.decode_range(worksheet['!ref'])
    worksheet['!ref'] = XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: range.e
    })

    hotData.value = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null
    })

    tableKey.value++
}

/**
 * Экспорт таблицы в XLSX
 */
const exportTable = (): void => {
    const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(hotData.value)
    const workbook: XLSX.WorkBook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

    const buffer: ArrayBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array'
    })

    saveAs(
        new Blob([buffer], { type: 'application/octet-stream' }),
        tableData.value?.fileName
    )
}

watch(tableData, () => {
    if (tableData.value?.data) {
        parseWorkbook(tableData.value?.data, tableData.value?.type)
    }
})
</script>

<template>
    <div class="table">
        <Upload @response="(data) => tableData = data" />
        <div v-if="hotData.length" class="table__hot-container">
            <HotTable :key="tableKey" :themeName="'ht-theme-main-dark'" :data="hotData" :rowHeaders="true"
                :colHeaders="true" :stretchH="'all'" :search="true" :manualColumnMove="true" :manualColumnResize="true"
                :contextMenu="true" :autoWrapRow="true" :autoWrapCol="true"
                licenseKey="non-commercial-and-evaluation" />
        </div>
        <button class="table__button" v-if="hotData.length" @click="exportTable">
            <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M20 6.05849V17.3529C20 17.7897 19.8285 18.2087 19.5232 18.5176C19.2179 18.8265 18.8038 19 18.3721 19H1.62791C1.19616 19 0.782095 18.8265 0.476803 18.5176C0.171511 18.2087 0 17.7897 0 17.3529V6.05849C0 5.62165 0.171511 5.2027 0.476803 4.89381C0.782095 4.58492 1.19616 4.41138 1.62791 4.41138H4.4186C4.60364 4.41138 4.7811 4.48576 4.91193 4.61814C5.04277 4.75052 5.11628 4.93007 5.11628 5.11728C5.11628 5.3045 5.04277 5.48405 4.91193 5.61643C4.7811 5.74881 4.60364 5.82319 4.4186 5.82319H1.62791C1.56623 5.82319 1.50708 5.84798 1.46346 5.8921C1.41985 5.93623 1.39535 5.99608 1.39535 6.05849V17.3529C1.39535 17.4153 1.41985 17.4752 1.46346 17.5193C1.50708 17.5634 1.56623 17.5882 1.62791 17.5882H18.3721C18.4338 17.5882 18.4929 17.5634 18.5365 17.5193C18.5802 17.4752 18.6047 17.4153 18.6047 17.3529V6.05849C18.6047 5.99608 18.5802 5.93623 18.5365 5.8921C18.4929 5.84798 18.4338 5.82319 18.3721 5.82319H15.5814C15.3964 5.82319 15.2189 5.74881 15.0881 5.61643C14.9572 5.48405 14.8837 5.3045 14.8837 5.11728C14.8837 4.93007 14.9572 4.75052 15.0881 4.61814C15.2189 4.48576 15.3964 4.41138 15.5814 4.41138H18.3721C18.8038 4.41138 19.2179 4.58492 19.5232 4.89381C19.8285 5.2027 20 5.62165 20 6.05849Z"
                    fill="#E74C3C" />
                <path
                    d="M14.0244 8.67787L10.5639 12.178L10.5639 0.705898C10.5639 0.518682 10.4904 0.339133 10.3596 0.206751C10.2287 0.0743688 10.0513 -1.90735e-06 9.86624 -1.90735e-06C9.68121 -1.90735e-06 9.50375 0.0743688 9.37291 0.206751C9.24207 0.339133 9.16857 0.518682 9.16857 0.705898L9.16857 12.178L5.7081 8.67787C5.64423 8.60852 5.56721 8.55289 5.48163 8.51431C5.39605 8.47572 5.30366 8.45498 5.20998 8.45331C5.11631 8.45163 5.02326 8.46907 4.93638 8.50457C4.84951 8.54008 4.7706 8.59292 4.70435 8.65995C4.6381 8.72698 4.58587 8.80683 4.55078 8.89472C4.51569 8.98262 4.49846 9.07677 4.50011 9.17155C4.50176 9.26633 4.52227 9.35981 4.5604 9.4464C4.59853 9.53299 4.65351 9.61092 4.72206 9.67554L9.37322 14.3815C9.50403 14.5137 9.68136 14.588 9.86624 14.588C10.0511 14.588 10.2285 14.5137 10.3593 14.3815L15.0104 9.67554C15.079 9.61092 15.134 9.53299 15.1721 9.4464C15.2102 9.35981 15.2307 9.26633 15.2324 9.17155C15.234 9.07677 15.2168 8.98262 15.1817 8.89472C15.1466 8.80683 15.0944 8.72698 15.0281 8.65995C14.9619 8.59292 14.883 8.54008 14.7961 8.50457C14.7092 8.46907 14.6162 8.45163 14.5225 8.45331C14.4288 8.45498 14.3364 8.47572 14.2509 8.51431C14.1653 8.55289 14.0883 8.60852 14.0244 8.67787Z"
                    fill="#E74C3C" />
            </svg>
        </button>
    </div>
</template>
