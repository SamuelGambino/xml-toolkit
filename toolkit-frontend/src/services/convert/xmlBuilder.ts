import type { Table } from "./TypesConvert";
import { escapeXml } from "./xmlUtils";

export const tableToXml = (inputTable: Table | null): string | null => {
  if (!inputTable) return null;

  const table = inputTable;
  if (!table || table.length < 2) return null;

  const headers = table[0];

  const idx = (name: string) =>
    headers?.findIndex(
      h => h?.toString().toLowerCase() === name.toLowerCase()
    );

  const IDX = {
    name: idx("Название"),
    price: idx("Цена"),
    vendor: idx("Артикул"),
    unit: idx("Ед. Измерения"),
    description: idx("Описание"),
    picture: idx("Изображение"),
    category: idx("Категория"),
    subcategory: idx("Подкатегория"),
  };

  const useCategoryColumns = IDX.category !== -1;

  const categoriesXml: string[] = [];
  const offersXml: string[] = [];

  let categoryIdCounter = 1;

  const categoryMap = new Map<string, number>();
  const subCategoryMap = new Map<string, number>();

  const getCategoryId = (name: string) => {
    if (!categoryMap.has(name)) {
      const id = categoryIdCounter++;
      categoryMap.set(name, id);
      categoriesXml.push(
        `      <category id="${id}">${escapeXml(name)}</category>`
      );
    }
    return categoryMap.get(name)!;
  };

  const getSubCategoryId = (catName: string, subName: string) => {
    const key = `${catName}::${subName}`;
    if (!subCategoryMap.has(key)) {
      const parentId = getCategoryId(catName);
      const id = categoryIdCounter++;
      subCategoryMap.set(key, id);
      categoriesXml.push(
        `      <category id="${id}" parent_id="${parentId}">${escapeXml(subName)}</category>`
      );
    }
    return subCategoryMap.get(key)!;
  };

  /** ===== обход строк ===== */
  for (let i = 1; i < table.length; i++) {
    const row = table[i];
    if (!row) continue;

    const cell = (row: any[], idx?: number) => {
      if (idx === undefined || idx === -1) return null;
      return row[idx];
    };

    const name = cell(row, IDX.name)?.toString().trim();
    if (!name) continue;

    /** ===== определяем categoryId ===== */
    let categoryId: number;

    if (useCategoryColumns) {
      const catName = cell(row, IDX.category)?.toString().trim();
      if (!catName) continue; // без категории товар не создаём

      const subName =
        IDX.subcategory !== -1
          ? cell(row, IDX.subcategory)?.toString().trim()
          : "";

      categoryId = subName
        ? getSubCategoryId(catName, subName)
        : getCategoryId(catName);
    } else {
      /** fallback — старая логика */
      const isCategoryRow = IDX.price === -1 || cell(row, IDX.price) == null;
      if (isCategoryRow) {
        getCategoryId(name);
        continue;
      }
      categoryId = categoryIdCounter - 1;
    }

    /** ===== товар ===== */
    const price = Number(cell(row, IDX.price)) || 0;
    const vendor = IDX.vendor !== -1 ? cell(row, IDX.vendor)?.toString() : "";

    const description =
      IDX.description !== -1
        ? cell(row, IDX.description)?.toString() : "";

    const picture =
      IDX.picture !== -1
        ? cell(row, IDX.picture)?.toString() : "";

    offersXml.push(`
      <offer id="${vendor ?? ""}" available="true">
        <name>${escapeXml(name)}</name>
        <description><![CDATA[${escapeXml(description)}]]></description>
        <picture>${escapeXml(picture)}</picture>
        <parameters>
          <parameter id="${vendor ?? ""}">
            <price>${price}</price>
            <description>1</description>
            <descriptionIndex>10</descriptionIndex>
          </parameter>
        </parameters>
        <categoryId>${categoryId}</categoryId>
      </offer>
    `.trim());
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${new Date().toISOString()}">
  <shop>
    <name>Organization name</name>
    <company>Company name</company>
    <url>https://example.com</url>
    <currencies>
      <currency id="RUR" rate="1" />
    </currencies>
    <categories>
${categoriesXml.join("\n")}
    </categories>
    <offers>
${offersXml.join("\n")}
    </offers>
  </shop>
</yml_catalog>`;

  return xml;
}