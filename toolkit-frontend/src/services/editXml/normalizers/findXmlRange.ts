import type TypesAnalizateXml from "../TypesAnalizateXml";

export const findXmlRange = (
  xml: string,
  search: string,
  fromIndex = 0
): TypesAnalizateXml.XmlRange | null => {
  const index = xml.indexOf(search, fromIndex);
  if (index === -1) return null;

  const before = xml.slice(0, index);
  const lines = before.split("\n");

  const startLine = lines.length;
  const startColumn = lines[lines.length - 1]!.length + 1;

  const searchLines = search.split("\n");
  const endLine = startLine + searchLines.length - 1;
  const endColumn =
    searchLines.length === 1
      ? startColumn + search.length
      : searchLines[searchLines.length - 1]!.length + 1;

  return {
    startLine,
    startColumn,
    endLine,
    endColumn
  };
}
