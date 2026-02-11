import type { Table } from "./TypesConvert";
import { escapeXml } from "./xmlUtils";

export const tableToXml = (inputTable: Table | null): string | null => {
  if (!inputTable || inputTable.length < 2) return null;

  const table = inputTable;
  const headers = table[0];

  const idx = (name: string) =>
    headers?.findIndex(
      h => h?.toString().trim().toLowerCase() === name.toLowerCase()
    );

  const IDX = {
    name: idx("Название"),
    price: idx("Цена"),
    vendor: idx("Артикул"),
    unit: idx("Ед. Изм."),
    description: idx("Описание"),
    picture: idx("Изображение"),
    category: idx("Категория"),
    subcategory: idx("Подкатегория"),
    optionsGroup: idx("группа опций"),
    optionsMin: idx("min опций"),
    optionsMax: idx("max опций"),
    optionName: idx("опции"),
    optionPrice: idx("цена опции"),
  };

  /* =========================
     КАТЕГОРИИ
  ========================== */

  const categoriesXml: string[] = [];
  const categoryMap = new Map<string, number>();
  let currentCategoryId: number | null = null;

  let categoryIndex = 1;

  const getCategoryId = (name: string) => {
    if (!categoryMap.has(name)) {
      const id = categoryIndex * 10000;
      categoryIndex++;
      categoryMap.set(name, id);

      categoriesXml.push(
        `<category id="${id}">${escapeXml(name)}</category>`
      );
    }
    return categoryMap.get(name)!;
  };

  /* =========================
     МОДИФИКАТОРЫ
  ========================== */

  const modifiersGroupsXml: string[] = [];
  const modifiersXml: string[] = [];

  const modifiersGroupMap = new Map<string, number>();
  const modifierMap = new Map<string, number>();
  const modifierCounterPerGroup = new Map<number, number>();

  let modifiersGroupIndex = 1;

  const getModifiersGroupId = (
    groupName: string,
    min: number,
    max: number
  ) => {
    if (!modifiersGroupMap.has(groupName)) {
      const id = modifiersGroupIndex * 1000;
      modifiersGroupIndex++;

      modifiersGroupMap.set(groupName, id);

      modifiersGroupsXml.push(`
<modifiersGroup id="${id}">
  <name>${escapeXml(groupName)}</name>
  <type>one_one</type>
  <minimum>${min}</minimum>
  <maximum>${max}</maximum>
</modifiersGroup>`.trim());
    }

    return modifiersGroupMap.get(groupName)!;
  };

  const getModifierId = (
    modifierName: string,
    price: number,
    groupId: number
  ) => {
    const key = `${groupId}::${modifierName}`;

    if (!modifierMap.has(key)) {
      const index =
        (modifierCounterPerGroup.get(groupId) ?? 0) + 1;

      modifierCounterPerGroup.set(groupId, index);

      const id = groupId + index;

      modifierMap.set(key, id);

      modifiersXml.push(`
<modifier id="${id}" required="true">
  <name>${escapeXml(modifierName)}</name>
  <price>${price}</price>
  <modifiersGroupId>${groupId}</modifiersGroupId>
</modifier>`.trim());
    }

    return modifierMap.get(key)!;
  };

  /* =========================
     ТОВАРЫ
  ========================== */

  const offersXml: string[] = [];
  const productCounterPerCategory = new Map<number, number>();
  const offerModifiersMap = new Map<number, Set<number>>();

  let currentProductId: number | null = null;
  let currentGroupId: number | null = null;

  for (let i = 1; i < table.length; i++) {
    const row = table[i];
    if (!row) continue;

    const cell = (idx?: number) =>
      idx === undefined || idx === -1 ? null : row[idx];

    const name = cell(IDX.name)?.toString().trim();

    /* ========= НОВЫЙ ТОВАР ========= */

    if (name) {
      const categoryName =
        cell(IDX.category)?.toString().trim();

      if (categoryName) {
        currentCategoryId = getCategoryId(categoryName);
      }

      if (!currentCategoryId) continue;

      const productIndex =
        (productCounterPerCategory.get(currentCategoryId) ?? 0) + 1;

      productCounterPerCategory.set(
        currentCategoryId,
        productIndex
      );

      const productId = currentCategoryId + productIndex;
      currentProductId = productId;
      currentGroupId = null;

      const price = Number(cell(IDX.price)) || 0;
      const unit = cell(IDX.unit)?.toString().trim() ?? "";
      const description = cell(IDX.description)?.toString() ?? "";
      const picture = cell(IDX.picture)?.toString() ?? "";

      const parameterId = (productId + 1000) * 10 + 1;

      offersXml.push(`
<offer id="${productId}" available="true">
  <name>${escapeXml(name)}</name>
  <description><![CDATA[${description}]]></description>
  <picture>${escapeXml(picture)}</picture>
  <parameters>
    <parameter id="${parameterId}">
      <price>${price}</price>
      <description>${escapeXml(unit)}</description>
      <descriptionIndex>10</descriptionIndex>
    </parameter>
  </parameters>
  <categoryId>${currentCategoryId}</categoryId>
</offer>`.trim());
    }

    /* ========= ГРУППА МОДИФИКАТОРОВ ========= */

    const groupName =
      cell(IDX.optionsGroup)?.toString().trim();

    if (groupName && currentProductId) {
      const min = Number(cell(IDX.optionsMin)) || 0;
      const max = Number(cell(IDX.optionsMax)) || 1;

      const groupId = getModifiersGroupId(groupName, min, max);
      currentGroupId = groupId;

      if (!offerModifiersMap.has(currentProductId)) {
        offerModifiersMap.set(currentProductId, new Set());
      }

      offerModifiersMap.get(currentProductId)!.add(groupId);
    }

    /* ========= МОДИФИКАТОР ========= */

    const optionName =
      cell(IDX.optionName)?.toString().trim();

    if (optionName && currentGroupId) {
      const optionPrice =
        Number(cell(IDX.optionPrice)) || 0;

      getModifierId(optionName, optionPrice, currentGroupId);
    }
  }

  /* =========================
     ДОБАВЛЯЕМ СВЯЗЬ ГРУПП К ТОВАРАМ
  ========================== */

  for (let i = 0; i < offersXml.length; i++) {
    const match = offersXml[i]?.match(/<offer id="(\d+)"/);
    if (!match) continue;

    const productId = Number(match[1]);
    const groups = offerModifiersMap.get(productId);

    if (!groups || groups.size === 0) continue;

    const groupsXml = `
  <modifiersGroupsIds>
    ${[...groups]
        .map(id => `<modifiersGroupId>${id}</modifiersGroupId>`)
        .join("\n    ")}
  </modifiersGroupsIds>`;

    offersXml[i] = offersXml[i]?.replace(
      `</offer>`,
      `${groupsXml}\n</offer>`
    ) ?? "";
  }

  /* =========================
     ИТОГОВЫЙ XML
  ========================== */

  return `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${new Date().toISOString()}">
  <shop>
    <name>Organization name</name>
    <company>Company name</company>
    <url>https://example.com</url>
    <currencies>
      <currency id="RUR" rate="1" />
    </currencies>

    <modifiersGroups>
${modifiersGroupsXml.join("\n")}
    </modifiersGroups>

    <modifiers>
${modifiersXml.join("\n")}
    </modifiers>

    <categories>
${categoriesXml.join("\n")}
    </categories>

    <offers>
${offersXml.join("\n")}
    </offers>

  </shop>
</yml_catalog>`;
};
