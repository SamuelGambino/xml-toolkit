<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";

import Upload, { type NormalizedFile } from "@/components/Upload/Upload.vue";
import Table from "@/components/Table/Table.vue";
import XmlView from "@/components/XmlView/XmlView.vue";
import ExportButton from "@/components/ExportButton/ExportButton.vue";
import Button from "@/components/Button/Button.vue";
import ColumnMapping from "@/components/ColumnMapping/ColumnMapping.vue";
import DropBox from "@/components/DropBox/DropBox.vue";

import {
  useConvertStore,
  getColumnNames,
  type XmlType,
} from "@/stores/useConverter";
import "./ConvertView.css";

type TableData = (string | number | boolean | null)[][];
type TSelectedFilter = "none" | "food" | "retail";

const XML_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "yandex", label: "Yandex" },
  { value: "delivery_club", label: "Delivery Club" },
  { value: "google", label: "Google" },
  { value: "product_feed", label: "Other product feed" },
];

const PRODUCT_CHARACTERISTIC = 'ProductParameterCharacteristic'
const PRODUCT_CHARACTERISTIC_UNIT = 'ProductParameterCharacteristicUnit'

const store = useConvertStore();
const { inputFile, actualConfig } = storeToRefs(store);

const uploadedFile = ref<NormalizedFile | null>(null);
const columnMappings = ref<Record<number, string>>({});
const characteristicLinks = ref<Record<number, number>>({})
const convertError = ref<string | null>(null);
const uploadError = ref<string | null>(null);
const convertLoading = ref(false);
const selectedOutputFormat = ref<string>("");
const selectedFilter = ref<TSelectedFilter>('none')

const filterOptions: { value: TSelectedFilter; label: string }[] = [
  { value: 'none', label: 'Общий' },
  { value: 'food', label: 'Food' },
  { value: 'retail', label: 'Retail' },
]

const filteredOptions = computed(() => {
  if (selectedFilter.value === 'none') {
    return supportedTypes.value
  }

  return supportedTypes.value.filter(
    (opt) => !opt.filter || opt.filter.includes(selectedFilter.value)
  )
});

const onUpload = async (file: NormalizedFile) => {
  uploadedFile.value = file;
  columnMappings.value = {};
  characteristicLinks.value = {}
  convertError.value = null;
  uploadError.value = null;

  if (file.type === "xml") {
    store.setXmlData(file.data);
    inputFile.value.table.data = null;
    inputFile.value.table.isConvertRes = null;
    selectedOutputFormat.value = convertToOptions.value[0]?.value ?? "";
    return;
  }

  inputFile.value.xml.data = null;
  inputFile.value.xml.detectedType = null;
  inputFile.value.xml.selectedType = null;

  if (file.type === "csv") {
    const encoder = new TextEncoder();
    const buffer = encoder.encode(file.data).buffer;
    store.uploadTable(buffer);
  } else {
    store.uploadTable(file.data);
  }
  selectedOutputFormat.value = convertToOptions.value[0]?.value ?? "";
};

const onUploadError = (message: string) => {
  uploadError.value = message;
};

const columns = computed(() =>
  getColumnNames(inputFile.value.table.data)
);

const supportedTypes = computed(() =>
  actualConfig.value?.supportedColumnTypes ?? []
);

/** "Convert to" options: exclude current source format (table → exclude table, xml → exclude xml) */
const convertToOptions = computed(() => {
  const formats = actualConfig.value?.supportedOutputFormats ?? [];
  if (hasXml.value) return formats.filter((f) => f.value !== "xml");
  if (hasTable.value) return formats.filter((f) => f.value !== "table");
  return formats;
});

const hasTable = computed(() => Boolean(inputFile.value.table.data));
const hasXml = computed(() => Boolean(inputFile.value.xml.data));

/** All columns have a mapping selected (required to enable Convert when table is loaded) */
const isCharacteristicUnitMappingValid = computed(() => {
  const unitIndexes = columns.value
    .filter((col) => columnMappings.value[col.index] === PRODUCT_CHARACTERISTIC_UNIT)
    .map((col) => col.index)

  if (unitIndexes.length === 0) return true

  const linkedUnits = new Set(Object.values(characteristicLinks.value))
  return unitIndexes.every((unitIndex) => linkedUnits.has(unitIndex))
})

const allColumnsMapped = computed(() => {
  const cols = columns.value;
  if (cols.length === 0) return true;
  const mapped = cols.every((col) => {
    const v = columnMappings.value[col.index];
    return v != null && String(v).trim() !== "";
  });
  return mapped && isCharacteristicUnitMappingValid.value
});

const canConvert = computed(() => {
  if (!hasTable.value && !hasXml.value) return false;
  if (hasXml.value && !inputFile.value.xml.selectedType) return false;
  if (hasTable.value && !allColumnsMapped.value) return false;
  return true;
});

const mappingsForBackend = computed(() => {
  const columnsMappings: { columnIndex: number; columnName: string; columnType: string }[] = [];
  const characteristics: { columnIndex: number; columnName: string; unitIndex?: number; xmlKey?: string }[] = [];

  columns.value.forEach((col) => {
    const t = columnMappings.value[col.index];
    if (!t) return

    if (t === PRODUCT_CHARACTERISTIC || t === PRODUCT_CHARACTERISTIC_UNIT) {
      return
    }

    columnsMappings.push({ columnIndex: col.index, columnName: col.name, columnType: t });
  });

  columns.value
    .filter((col) => columnMappings.value[col.index] === PRODUCT_CHARACTERISTIC)
    .forEach((col) => {
      characteristics.push({
        columnIndex: col.index,
        columnName: col.name,
        unitIndex: characteristicLinks.value[col.index],
      })
    })

  return {
    columns: columnsMappings,
    characteristic: characteristics,
  };
});

const canConvertViaBackend = computed(
  () =>
    Boolean(
      inputFile.value.table.data &&
      uploadedFile.value &&
      "file" in uploadedFile.value &&
      uploadedFile.value.file &&
      allColumnsMapped.value &&
      selectedOutputFormat.value &&
      mappingsForBackend.value.columns.length + (mappingsForBackend.value.characteristic?.length ?? 0) + new Set(Object.values(characteristicLinks.value)).size === columns.value.length
    )
);

const convert = async () => {
  convertError.value = null;

  // Use backend conversion if table is loaded and mappings are provided
  if (inputFile.value.table.data && canConvertViaBackend.value) {
    const file = (uploadedFile.value as NormalizedFile & { file?: File }).file;
    if (!file) {
      convertError.value = "Файл не найден";
      return;
    }

    convertLoading.value = true;
    try {
      const sourceType = 'table';
      const targetType = selectedOutputFormat.value || 'yml';
      const convertedContent = await store.convertTableViaBackend(file, mappingsForBackend.value, {
        sourceType,
        targetType,
      });

      if (targetType === 'table') {
        store.uploadTable(convertedContent);
        inputFile.value.table.isConvertRes = true;
        inputFile.value.xml.isConvertRes = null;
        inputFile.value.xml.data = null;
      } else {
        inputFile.value.xml = {
          ...inputFile.value.xml,
          data: convertedContent,
          isConvertRes: true,
        };
        inputFile.value.table.isConvertRes = false;
      }
    } catch (e: unknown) {
      convertError.value = e instanceof Error ? e.message : "Ошибка запроса";
    } finally {
      convertLoading.value = false;
    }
    return;
  }
};

const showSourceTable = computed(
  () => inputFile.value.table.data && inputFile.value.table.isConvertRes !== true
);

const showSourceXml = computed(
  () => inputFile.value.xml.data && inputFile.value.xml.isConvertRes !== true
);

const showResultTable = computed(
  () => inputFile.value.table.data && inputFile.value.table.isConvertRes === true
);

const showResultXml = computed(
  () => inputFile.value.xml.data && inputFile.value.xml.isConvertRes === true
);

const exportSourceFile = computed(() => {
  if (!uploadedFile.value) return null;

  return {
    rawFileName: uploadedFile.value.fileName,
    type: uploadedFile.value.type,
    data: inputFile.value.table.isConvertRes
      ? inputFile.value.xml.data
      : inputFile.value.table.data,
  };
});

const exportResultFile = computed(() => {
  if (!uploadedFile.value) return null;
  const type: "csv" | "xml" | "array" | null = inputFile.value.table.isConvertRes ? "csv" : "xml";

  return {
    rawFileName: uploadedFile.value.fileName,
    type,
    data: inputFile.value.table.isConvertRes
      ? inputFile.value.table.data
      : inputFile.value.xml.data,
  };
});

const sourceTableData = computed(() => (
  inputFile.value.table.data as TableData | null
));

const resultTableData = computed(() => (
  inputFile.value.table.data as TableData | null
));

onMounted(() => {
  store.getConfig();
});

watch(convertToOptions, (opts) => {
  const first = opts[0]
  if (opts.length === 1 && first && selectedOutputFormat.value !== first.value) {
    selectedOutputFormat.value = first.value;
  }
}, { immediate: true });
</script>

<template>
  <section class="convert">
    <div class="convert__wrapper">
      <Upload @upload="onUpload" @error="onUploadError" :fileName="uploadedFile?.fileName" :maxSize="20" />

      <p v-if="uploadError" class="convert__error">{{ uploadError }}</p>

      <Table v-if="showSourceTable" :data="sourceTableData" v-on:update="(value) => inputFile.table.data = value" />

      <XmlView v-if="showSourceXml" :inputXml="inputFile.xml.data ?? ''"
        v-on:update="(value) => inputFile.xml.data = value" />

      <div v-if="showSourceXml" class="convert__options">
        <label class="convert__label">Тип XML</label>
        <DropBox class="convert__drop-box" :options="[{ value: '', label: 'Тип не определён' }, ...XML_TYPE_OPTIONS]"
          :modelValue="(inputFile.xml.selectedType ?? '')"
          @update:modelValue="(v: string) => store.setXmlSelectedType((v || null) as XmlType)" />
      </div>

      <ExportButton class="convert__button" v-if="exportSourceFile" type="upload" :file="exportSourceFile" />
    </div>

    <div class="convert__wrapper">
      <Button class="convert__button convert__button--convert" :isDisabled="!canConvert || convertLoading"
        :isLoading="convertLoading" @click="convert">
        Конвертировать
      </Button>

      <div v-if="showSourceTable && columns.length > 0 && supportedTypes.length > 0" class="convert__filter-options">
        <label class="convert__label">Выберите тип номенклатуры:</label>
        <div class="convert__filter-item" v-for="option in filterOptions" :key="option.value">
          <input type="radio" :id="option.value" :value="option.value" v-model="selectedFilter">
          <label :for="option.value">{{ option.label }}</label>
        </div>
      </div>

      <div v-if="(showSourceTable || showSourceXml) && convertToOptions.length > 0" class="convert__options">
        <label class="convert__label">Конвертировать в</label>
        <DropBox class="convert__drop-box" :options="convertToOptions" v-model="selectedOutputFormat" />
      </div>

      <ColumnMapping v-if="showSourceTable && columns.length > 0 && supportedTypes.length > 0" :columns="columns"
        :supported-types="filteredOptions" v-model="columnMappings" v-model:characteristicLinks="characteristicLinks" />
      <p v-if="showSourceTable && !isCharacteristicUnitMappingValid" class="convert__error">
        Для поля "Ед.Изм. характеристики товара" должна быть выбрана связанная колонка "Характеристика товара".
      </p>
      <p v-if="convertError" class="convert__error">{{ convertError }}</p>
    </div>

    <div class="convert__wrapper">
      <XmlView v-if="showResultXml" :inputXml="inputFile.xml.data ?? ''"
        v-on:update="(value) => inputFile.xml.data = value" />

      <Table v-if="showResultTable" :data="resultTableData" v-on:update="(value) => inputFile.table.data = value" />

      <ExportButton class="convert__button" v-if="exportResultFile" type="convert" :file="exportResultFile" />
    </div>
  </section>
</template>
