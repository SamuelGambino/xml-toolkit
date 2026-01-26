import { defineStore } from "pinia";
import { ref } from "vue";
import { loadTable } from "@/services/convert/tableLoader";
import { xmlToTable } from "@/services/convert/xmlParser";
import { tableToXml } from "@/services/convert/xmlBuilder";

type Table = (string | number | boolean | null)[][];

export interface IConvertStore {
  xml: {
    data: string | null;
    isConvertRes: boolean | null;
  };
  table: {
    data: Table | null;
    isConvertRes: boolean | null;
  };
}

export const useConvertStore = defineStore("convert", () => {
  const inputFile = ref<IConvertStore>({
    xml: {
      data: null,
      isConvertRes: null,
    },
    table: {
      data: null,
      isConvertRes: null,
    },
  });

  const uploadTable = (input: string | ArrayBuffer) => {
    inputFile.value.table = {
      isConvertRes: false,
      data: loadTable(input),
    };
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
      isConvertRes: data ? true : null,
      data: data ? data : null,
    }
  };

  const reset = () => {
    inputFile.value = {
      xml: {
        isConvertRes: null,
        data: null,
      },
      table: {
        isConvertRes: null,
        data: null,
      }
    }
  }

  return { inputFile, convertTableToXml, convertXmlToTable, uploadTable, reset };
});
