import { getMetaData } from "./analyze/getMetaData"
import { normalizeModifiers } from "./normalizers/normalizeModifiers"
import { normalizeProducts } from "./normalizers/normalizeProducts"
import TypesEditXml from "./TypesAnalizateXml"

export const analyzeXml = (parsedXml: any, rawXml: string) => {
  const normalizedXml: TypesEditXml.INormalizeXml = {
    modifiersGroups: normalizeModifiers(parsedXml, rawXml),
    categories: normalizeProducts(parsedXml, rawXml),
  }

  return getMetaData(normalizedXml);
}
