import { defineStore } from "pinia";
import { ref } from "vue";
import { loadTable } from "@/services/convert/tableLoader";
import { xmlToTable } from "@/services/convert/xmlParser";
import { tableToXml } from "@/services/convert/xmlBuilder";
import axios from "axios";
import type { Table } from "@/services/convert/TypesConvert";

/** Detected/selected XML feed type for conversion */
export type XmlType =
  | "yandex"
  | "delivery_club"
  | "google"
  | "facebook"
  | "product_feed"
  | null;

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
  /** Result from backend convert (universal object) */
  backendResult: unknown | null;
}

export interface IConfigColumnType {
  value: string;
  label: string;
  labelRu?: string;
  description?: string;
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
    backendResult: null,
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
    console.log("Uploading table, input type:", typeof input);
    inputFile.value.backendResult = null;
    try {
      const tableData = loadTable(input);
      console.log("Table loaded:", {
        rows: tableData.length,
        firstRow: tableData[0],
        columnCount: tableData[0]?.length,
      });
      inputFile.value.table = {
        isConvertRes: false,
        data: tableData,
      };
      console.log("Table stored in inputFile:", {
        hasData: !!inputFile.value.table.data,
        rowCount: inputFile.value.table.data?.length,
        isConvertRes: inputFile.value.table.isConvertRes,
      });
    } catch (error) {
      console.error("Error loading table:", error);
      throw error;
    }
  };

  const convertXmlToTable = () => {
    const data = xmlToTable(inputFile.value.xml.data);

    inputFile.value.table = {
      isConvertRes: data ? true : null,
      data: data ? data : null,
    }
  };

  const convertTableToXml = () => {
    const data = tableToXml(inputFile.value.table.data);

    inputFile.value.xml = {
      ...inputFile.value.xml,
      isConvertRes: data ? true : null,
      data: data ?? null,
    };
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
      backendResult: null,
    };
  };

  const getConfig = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/config/convert");
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
      characteristic?: { columnIndex: number; columnName: string; unitIndex?: number }[];
    }
  ) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mappings", JSON.stringify(mappings));
      
      console.log("Sending request to backend with:", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        mappingsCount: mappings.columns.length,
      });
      
      const response = await axios.post("http://localhost:3000/api/config/convert", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300000, // 5 minutes timeout for large files
      });
      
      const data = response.data;
      console.log("Backend response received:", { success: data?.success, hasData: !!data?.data });
      
      if (data?.success && data?.data) {
        inputFile.value.backendResult = data.data;
      }
      return data;
    } catch (error: any) {
      console.error("Backend request error:", error);
      if (error.response) {
        throw new Error(error.response.data?.error || `Server error: ${error.response.status}`);
      } else if (error.request) {
        throw new Error("Не удалось подключиться к серверу. Убедитесь, что backend запущен.");
      } else {
        throw new Error(error.message || "Неизвестная ошибка");
      }
    }
  };

  return {
    actualConfig,
    inputFile,
    getConfig,
    convertTableToXml,
    convertXmlToTable,
    convertTableViaBackend,
    uploadTable,
    reset,
    setXmlData,
    setXmlSelectedType,
  };
});
