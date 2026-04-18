import { defineStore } from "pinia";
import { ref } from "vue";
import { loadTable } from "@/services/convert/tableLoader";
import { apiClient } from "@/services/api/http";
import type { Table } from "@/services/convert/TypesConvert";

/** Detected/selected XML feed type for conversion */
export type XmlType =
  | "yandex"
  | "delivery_club"
  | "google"
  | "facebook"
  | "product_feed"
  | null;
  
export type ColumnTemplate = "universal" | "food" | "retail";
export type ColumnVisibilityPriority = "primary" | "secondary" | "hidden";

export interface IConvertStore {
  xml: {
    data: string | null;
    isConvertRes: boolean | null;
    /** Auto-detected from first lines of the file */
    detectedType: XmlType;
    /** User-selected or auto-selected type (used for convert) */
    selectedType: XmlType;
  };
  table: {
    data: Table | null;
    isConvertRes: boolean | null;
  };
}

export interface IConfigColumnType {
  value: string;
  label: string;
  labelRu?: string;
  description?: string;
  filter?: string[];
  domains?: Partial<Record<"yml" | "extended_yml" | "google_feed", { parent_tag: string; tag: string; attribute?: string }>>;
  priority?: Partial<Record<ColumnTemplate, ColumnVisibilityPriority>>;
}

export interface IConfigOutputFormat {
  value: string;
  label: string;
}

export interface IConfig {
  supportedColumnTypes: IConfigColumnType[];
  /** Output formats for "Convert to" (e.g. table, xml). Exclude current format in UI. */
  supportedOutputFormats?: IConfigOutputFormat[];
}

/**
 * Reads the first few lines/chars of XML and detects feed type:
 * - yml_catalog / dc_catalog -> Yandex / Delivery Club
 * - rss, feed + xmlns (Google/Facebook) -> corresponding type
 * - <offer> or <item> -> Product feed
 */
export function detectXmlType(xmlContent: string | null): XmlType {
  if (!xmlContent || typeof xmlContent !== "string") return null;
  const head = xmlContent.slice(0, 4000).replace(/\s+/g, " ");

  if (head.includes("yml_catalog") || /<yml_catalog\b/.test(head)) {
    return "yandex";
  }
  if (head.includes("dc_catalog") || /<dc_catalog\b/.test(head)) {
    return "delivery_club";
  }

  const hasRss = /<rss\b/.test(head) || /<feed\b/.test(head);
  if (hasRss) {
    if (/xmlns[^=]*=[^"]*google\.com/i.test(head) || /schemas\.google\.com/i.test(head)) {
      return "google";
    }
    if (/xmlns[^=]*=[^"]*facebook\.com/i.test(head) || /fb\.com/i.test(head)) {
      return "facebook";
    }
  }

  if (/<offer\b/.test(head) || /<item\b/.test(head)) {
    return "product_feed";
  }

  return null;
}

/** Returns column names from the first row; columns with empty header are excluded (e.g. after user deletes the name) */
export function getColumnNames(table: Table | null): { index: number; name: string }[] {
  if (!table || table.length === 0) return [];
  const firstRow = table[0];
  if (!firstRow) return [];
  return firstRow
    .map((cell, index) => ({
      index,
      name: String(cell ?? "").trim(),
    }))
    .filter((col) => col.name !== "");
}

export const useConvertStore = defineStore("convert", () => {
  const inputFile = ref<IConvertStore>({
    xml: {
      data: null,
      isConvertRes: null,
      detectedType: null,
      selectedType: null,
    },
    table: {
      data: null,
      isConvertRes: null,
    },
  });
  const actualConfig = ref<IConfig | null>(null);

  /** Set XML content and run type detection. Call when user uploads an XML file. */
  const setXmlData = (data: string | null) => {
    inputFile.value.xml.data = data;
    inputFile.value.xml.isConvertRes = false;
    if (data) {
      const detected = detectXmlType(data);
      inputFile.value.xml.detectedType = detected;
      inputFile.value.xml.selectedType = detected;
    } else {
      inputFile.value.xml.detectedType = null;
      inputFile.value.xml.selectedType = null;
    }
  };

  const setXmlSelectedType = (type: XmlType) => {
    inputFile.value.xml.selectedType = type;
  };

  const uploadTable = (input: string | ArrayBuffer) => {
    try {
      const tableData = loadTable(input);
      inputFile.value.table = {
        isConvertRes: false,
        data: tableData,
      };
    } catch (error) {
      console.error("Error loading table:", error);
      throw error;
    }
  };

  const reset = () => {
    inputFile.value = {
      xml: {
        isConvertRes: null,
        data: null,
        detectedType: null,
        selectedType: null,
      },
      table: {
        isConvertRes: null,
        data: null,
      },
    };
  };

  const getConfig = async () => {
    try {
      const response = await apiClient.get("/api/config/convert");
      const data = response.data;
      actualConfig.value = {
        supportedColumnTypes: data.supportedColumnTypes ?? [],
        supportedOutputFormats: data.supportedOutputFormats ?? [],
      };
    } catch (err) {
      console.error("Failed to load config:", err);
      actualConfig.value = {
        supportedColumnTypes: [],
        supportedOutputFormats: [],
      };
    }
  };

  const convertTableViaBackend = async (
    file: File,
    mappings: {
      columns: { columnIndex: number; columnName: string; columnType: string }[];
      characteristic?: { columnIndex: number; columnName: string; unitIndex?: number; xmlKey?: string; }[];
    },
    params: { sourceType: string; targetType: string }
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mappings', JSON.stringify(mappings));
    formData.append('sourceType', params.sourceType);
    formData.append('targetType', params.targetType);

    const response = await apiClient.post('/api/config/convert', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'text',
    });

    return response.data as string;
  };

  return {
    actualConfig,
    inputFile,
    getConfig,
    convertTableViaBackend,
    uploadTable,
    reset,
    setXmlData,
    setXmlSelectedType,
  };
});
