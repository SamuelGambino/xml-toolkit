import { XMLParser } from "fast-xml-parser";
import type { Table } from "./TypesConvert";

export const xmlToTable = (xml: string | null): Table | null => {
  if (!xml) return null;

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    trimValues: true,
  });

  const parsed = parser.parse(xml);

  const shop = parsed?.yml_catalog?.shop;
  if (!shop) return null;

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
    "Изображение",
  ]);

  categories.forEach((cat: any) => {
    const categoryId = String(cat.id);
    const categoryName = cat["#text"] ?? "";

    /** строка категории */
    table.push([
      categoryName,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ]);

    const catOffers = offersByCategory.get(categoryId) ?? [];

    catOffers.forEach((o: any) => {
      /** цена */
      const price =
        o.parameters?.parameter?.price ??
        o.price ??
        "";

      /** === Ед.Изм. (param name="Вес") === */
      let unit = "";

      const params = Array.isArray(o.param)
        ? o.param
        : o.param
        ? [o.param]
        : [];

      const weightParam = params.find(
        (p: any) => p.name === "Вес"
      );

      if (weightParam) {
        unit = weightParam["#text"] ?? "";
      }

      /** === Изображение === */
      let picture = "";

      if (Array.isArray(o.picture)) {
        picture = o.picture[0] ?? "";
      } else {
        picture = o.picture ?? "";
      }

      table.push([
        o.name ?? "",
        Number(price) || 0,
        unit,
        o.id ?? o.vendorCode ?? "",
        "Да",
        o.modifiers_groups_ids ? "Да" : "",
        "Да",
        "Да",
        0,
        o.description ?? "",
        picture,
      ]);
    });

    /** пустая строка между категориями */
    table.push([
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
  });

  return table;
};
