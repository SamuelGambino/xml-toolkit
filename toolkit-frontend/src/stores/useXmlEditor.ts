import { defineStore } from "pinia";
import { XMLParser } from "fast-xml-parser";
import { ref } from "vue";
import { analyzeXml } from "@/services/editXml/analyzeXml";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: true,
  parseAttributeValue: true
});

interface XmlRange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
};

export const useXmlEditorStore = defineStore("xmlEditor", () => {
  const sourceXml = ref<string | null>(null);
  const parsedJson = ref<any>(null);
  const schema = ref<any>(null);
  const activeRange = ref<XmlRange | null>(null);

  const loadXml = (xml: string) => {
    sourceXml.value = xml;
    parsedJson.value = null;
    schema.value = null;
  }

  const parseXml = () => {
    if (!sourceXml.value) return;

    try {
      parsedJson.value = parser.parse(sourceXml.value);
    } catch (e) {
      console.error("XML parse error", e);
      parsedJson.value = null;
    }
  }

  const selectRange = (range: XmlRange) => {
    activeRange.value = range;
  };

  const clearRange = () => {
    activeRange.value = null;
  }

  const generateSchema = () => {
    if (!parsedJson.value) return;

    schema.value = analyzeXml(parsedJson.value.yml_catalog.shop, sourceXml.value ?? "");
  }

  const reset = () => {
    sourceXml.value = null;
    parsedJson.value = null;
    schema.value = null;
  }

  return {
    sourceXml,
    parsedJson,
    schema,
    loadXml,
    parseXml,
    generateSchema,
    reset,
    selectRange,
    clearRange
  };
});
