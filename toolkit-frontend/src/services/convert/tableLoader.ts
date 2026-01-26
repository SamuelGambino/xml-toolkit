// services/tableLoader.ts
import * as XLSX from "xlsx";
import type { Table } from "./TypesConvert";

export const loadTable = (input: string | ArrayBuffer): Table => {
  const workbook =
    typeof input === "string"
      ? XLSX.read(input, { type: "string" })
      : XLSX.read(input, { type: "array" });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("No sheet");

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet || !worksheet["!ref"]) throw new Error("Invalid sheet");

  return XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: null,
    raw: false,
  });
}
