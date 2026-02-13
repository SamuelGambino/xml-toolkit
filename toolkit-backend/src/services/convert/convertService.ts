import { Express } from "express"
import { ConvertConfig } from "../../types/convertTypes"
import { convertXmlToCsv } from "./XmlToCsv"
import { convertCsvToXml } from "./CsvToXml"

export const convertService = async (
  file: Express.Multer.File,
  config: ConvertConfig
): Promise<Buffer> => {

  const fileBuffer = file.buffer

  // определить тип файла
  const mime = file.mimetype

  if (mime === "text/xml") {
    return convertXmlToCsv(fileBuffer, config)
  }

  if (mime === "text/csv") {
    return convertCsvToXml(fileBuffer, config)
  }

  throw new Error("Unsupported file type")
}
