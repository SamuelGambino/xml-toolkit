import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

type Table = (string | number | boolean | null)[][];

interface ExportFile {
  rawFileName: string;
  type: "csv" | "xml" | "array" | null;
  data: Table | string | null;
}


export const exportFile = (file: ExportFile) => {
  if(!file.type || !file.data) return;

  switch (file.type) {
    case "array":
      return exportExcel(file);
    case "csv":
      return exportCsv(file);
    case "xml":
      return exportXml(file);
  }
}

const exportExcel = (file: ExportFile) => {
  const table = file.data as Table;

  const ws = XLSX.utils.aoa_to_sheet(table);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([buffer]), normalize(file.rawFileName, "xlsx"));
}

const exportCsv = (file: ExportFile) => {
  const ws = XLSX.utils.aoa_to_sheet(file.data as Table);
  const csv = XLSX.utils.sheet_to_csv(ws);
  saveAs(new Blob([csv]), normalize(file.rawFileName, "csv"));
}

const exportXml = (file: ExportFile) => {
  saveAs(new Blob([file.data as string]), normalize(file.rawFileName, "xml"));
}

const normalize = (name: string, ext: string) => {
  return name.replace(/\.[^/.]+$/, "") + "." + ext;
}
