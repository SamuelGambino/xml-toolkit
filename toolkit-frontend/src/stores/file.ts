import { defineStore } from "pinia";
import { XMLParser } from "fast-xml-parser";
import { ref } from "vue";

interface Category {
  id: string;
  name: string;
  products: Product[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  vendorCode?: string;
  description?: string;
  modifiersGroupIds?: string[];
}

interface IResult {
  source: "xml-to-table" | "table-to-xml";
  xml?: string;
  csv?: (string | number | boolean | null)[][] | null;
  meta?: {
    categoriesCount: number;
    productsCount: number;
    modifiersGroupsCount: number;
  };
}

export type Table = (string | number | boolean | null)[][];

export type IInputFile =
  {
    type: "array" | "string" | "xml" | null;
    fileName: string | null;
    raw: string | ArrayBuffer | null;
    table: (string | number | boolean | null)[][] | null;
    convertResult?: IResult
  };

export const useFileStore = defineStore("file", () => {
  const inputFile = ref<IInputFile>({
    type: null,
    fileName: null,
    raw: null,
    table: null,
  });

  const tableToDomain = (table: Table) => {
    const categories: Category[] = [];

    let currentCategory: Category | null = null;

    for (const row of table) {
      const name = row[0]?.toString().trim();

      if (!name) {
        currentCategory = null;
        continue;
      }

      // Категория (в CSV у неё только "Название")
      if (!row[1]) {
        currentCategory = {
          id: crypto.randomUUID(),
          name,
          products: [],
        };
        categories.push(currentCategory);
        continue;
      }

      // Товар
      if (!currentCategory) continue;

      currentCategory.products.push({
        id: crypto.randomUUID(),
        name,
        price: Number(row[1]) || 0,
        vendorCode: row[3]?.toString(),
        description: row[9]?.toString(),
      });
    }

    return categories;
  }

  const domainToXml = (categories: Category[]) => {
    const offers: string[] = [];
    const categoryXml: string[] = [];

    categories.forEach((cat, index) => {
      categoryXml.push(`      <category id="${index + 1}">${escapeXml(cat.name)}</category>`);

      cat.products.forEach((p) => {
        offers.push(`      <offer id="${p.vendorCode ? p.vendorCode : null}" available="true">
        <name>${escapeXml(p.name)}</name>
        <description><![CDATA[${p.description ? escapeXml(p.description) : ""}]]></description>
        <parameters>
          <parameter id="${p.vendorCode ? p.vendorCode : null}">
            <price>${p.price}</price>
            <description>1</description>
            <descriptionIndex>10</descriptionIndex>
        <categoryId>${index + 1}</categoryId>
      </offer>`);
      });
    });

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
    </modifiersGroups>
    <modifiers>
    </modifiers>
    <categories>
${categoryXml.join("\n")}
    </categories>
    <offers>
${offers.join("\n")}
    </offers>
  </shop>
</yml_catalog>`;
  }

  const escapeXml = (value: string) => {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const convertXmlToTable = (file: IInputFile) => {
    if (file.type !== "xml" || typeof file.raw !== "string") return;

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      trimValues: true,
    });

    const parsed = parser.parse(file.raw);

    const shop = parsed?.yml_catalog?.shop;
    if (!shop) return;

    const categories = Array.isArray(shop.categories?.category)
      ? shop.categories.category
      : [];

    const offers = Array.isArray(shop.offers?.offer)
      ? shop.offers.offer
      : [];

    /** index категорий по id */
    const categoryMap = new Map<string, string>();
    categories.forEach((c: any) => {
      categoryMap.set(String(c.id), c["#text"] ?? "");
    });

    /** Группировка офферов по categoryId */
    const offersByCategory = new Map<string, any[]>();
    offers.forEach((o: any) => {
      const catId = String(o.categoryId);
      if (!offersByCategory.has(catId)) {
        offersByCategory.set(catId, []);
      }
      offersByCategory.get(catId)!.push(o);
    });

    /** ===== формирование таблицы ===== */
    const table: Table = [];

    /** Заголовки Frontpad */
    table.push([
      "Название",
      "Цена",
      "Ед.Изм.",
      "Артикул",
      "Скидки",
      "Модификаторы",
      "Изм.Цены",
      "Остаток",
      "Баллы",
      "Описание",
    ]);

    categories.forEach((cat: any) => {
      const categoryId = String(cat.id);
      const categoryName = cat["#text"] ?? "";

      /** строка категории */
      table.push([categoryName, null, null, null, null, null, null, null, null, null]);

      const catOffers = offersByCategory.get(categoryId) ?? [];

      catOffers.forEach((o: any) => {
        const price =
          o.parameters?.parameter?.price ??
          o.price ??
          "";

        table.push([
          o.name ?? "",
          Number(price) || 0,
          "",
          o.id ?? "",
          "Да",
          o.modifiers_groups_ids ? "Да" : "",
          "Да",
          "Да",
          0,
          o.description ?? "",
        ]);
      });

      /** пустая строка между категориями */
      table.push([null, null, null, null, null, null, null, null, null, null]);
    });

    file.table = table;
    file.convertResult = {
      source: "xml-to-table",
      csv: table,
      meta: {
        categoriesCount: categories.length,
        productsCount: offers.length,
        modifiersGroupsCount: 0,
      },
    };
  };

  const convertTableToXml = (file: IInputFile) => {
    if (!file.table) return;

    const domain = tableToDomain(file.table);
    const xml = domainToXml(domain);

    file.convertResult = {
      source: "table-to-xml",
      xml,
      csv: undefined,
      meta: {
        categoriesCount: domain.length,
        productsCount: domain.reduce((a, c) => a + c.products.length, 0),
        modifiersGroupsCount: 0,
      },
    };
  }


  return { inputFile, convertTableToXml, convertXmlToTable };
});
