import * as xml2js from 'xml2js';
import { UniversalProductData, Category, Product, ProductParameter, ModifierGroup, Modifier } from '../domain/models';
import { generateId } from '../domain/idGenerator';

export type XmlSourceType = 'yml' | 'delivery_club' | 'google_feed';

const toArray = <T>(value: T | T[] | undefined): T[] => {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
};

const text = (value: any): string | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    if (typeof value._ === 'string') return value._.trim();
    if (typeof value['#text'] === 'string') return value['#text'].trim();
  }
  return undefined;
};

const numberOrUndefined = (value: any): number | undefined => {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
};

export class UniversalXmlParser {
  static async parse(xml: string, sourceType: XmlSourceType): Promise<UniversalProductData> {
    const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true, trim: true });
    const result = await parser.parseStringPromise(xml);

    switch (sourceType) {
      case 'yml':
        return this.fromYml(result);
      case 'delivery_club':
        return this.fromDeliveryClub(result);
      case 'google_feed':
        return this.fromGoogleFeed(result);
      default:
        throw new Error(`Unsupported XML sourceType: ${sourceType}`);
    }
  }

  private static fromYml(parsed: any): UniversalProductData {
    const shop = parsed?.yml_catalog?.shop ?? parsed?.shop;
    if (!shop) return { categories: [], modifierGroups: [] };

    const categoriesRaw = toArray(shop.categories?.category);
    const offersRaw = toArray(shop.offers?.offer);
    const modifierGroupsRaw = toArray(shop.modifiersGroups?.modifiersGroup);
    const modifiersRaw = toArray(shop.modifiers?.modifier);

    const modifierGroups = this.mapModifierGroups(modifierGroupsRaw, modifiersRaw);

    const categoryById = new Map<string, Category>();
    categoriesRaw.forEach((cat) => {
      const id = text(cat.id) ?? generateId('cat');
      categoryById.set(id, {
        id,
        name: text(cat._) ?? text(cat['#text']) ?? text(cat.name) ?? '',
        parentId: text(cat.parentId),
        products: [],
      });
    });

    offersRaw.forEach((offer) => {
      const categoryId = text(offer.categoryId) ?? 'uncategorized';
      if (!categoryById.has(categoryId)) {
        categoryById.set(categoryId, { id: categoryId, name: 'Без категории', products: [] });
      }

      const product = this.mapOfferToProduct(offer);
      categoryById.get(categoryId)!.products.push(product);
    });

    return { categories: [...categoryById.values()], modifierGroups };
  }

  private static fromDeliveryClub(parsed: any): UniversalProductData {
    const shop = parsed?.dc_catalog?.shop ?? parsed?.yml_catalog?.shop ?? parsed?.shop;
    if (!shop) return { categories: [], modifierGroups: [] };
    return this.fromYml({ yml_catalog: { shop } });
  }

  private static fromGoogleFeed(parsed: any): UniversalProductData {
    const channel = parsed?.rss?.channel;
    const items = toArray(channel?.item);

    const categoryMap = new Map<string, Category>();

    items.forEach((item) => {
      const categoryName = text(item['g:google_product_category']) ?? text(item['g:product_type']) ?? 'Без категории';
      const categoryId = categoryName;
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, { id: categoryId, name: categoryName, products: [] });
      }

      const priceRaw = text(item['g:price']) ?? '0';
      const price = Number(priceRaw.split(' ')[0].replace(',', '.')) || 0;
      const productId = text(item['g:id']) ?? generateId('prod');
      const weightRaw = text(item['g:shipping_weight']);

      const parameters: ProductParameter[] = [
        {
          id: `${productId}_param`,
          characteristics: [
            { name: 'Price', value: price, unit: priceRaw.split(' ')[1] },
            { name: 'Weight', value: Number(weightRaw?.split(' ')[0] ?? '0') || 0, unit: weightRaw?.split(' ')[1] },
          ],
        },
      ];

      const product: Product = {
        id: productId,
        name: text(item['g:title']) ?? text(item.title) ?? '',
        description: text(item['g:description']) ?? text(item.description),
        image: text(item['g:image_link']),
        modifers: [],
        parameters,
      };

      categoryMap.get(categoryId)!.products.push(product);
    });

    return { categories: [...categoryMap.values()], modifierGroups: [] };
  }

  private static mapModifierGroups(groupsRaw: any[], modifiersRaw: any[]): ModifierGroup[] {
    const modifiersByGroup = new Map<string, Modifier[]>();

    modifiersRaw.forEach((modifier) => {
      const groupId = text(modifier.modifiersGroupId);
      if (!groupId) return;
      if (!modifiersByGroup.has(groupId)) modifiersByGroup.set(groupId, []);
      modifiersByGroup.get(groupId)!.push({
        id: text(modifier.id) ?? generateId('mod'),
        name: text(modifier.name) ?? '',
        price: numberOrUndefined(text(modifier.price)) ?? 0,
      });
    });

    return groupsRaw.map((group) => {
      const id = text(group.id) ?? generateId('mg');
      return {
        id,
        name: text(group.name) ?? '',
        type: text(group.type),
        minSelect: numberOrUndefined(text(group.minimum)),
        maxSelect: numberOrUndefined(text(group.maximum)),
        modifiers: modifiersByGroup.get(id) ?? [],
      };
    });
  }

  private static mapOfferToProduct(offer: any): Product {
    const productId = text(offer.id) ?? generateId('prod');
    const paramsRaw = toArray(offer.parameters?.parameter);

    const parameters: ProductParameter[] = paramsRaw.length
      ? paramsRaw.map((param: any, idx: number) => ({
          id: text(param.id) ?? `${productId}_param_${idx + 1}`,
          characteristics: [
            {
              name: 'Price',
              value: numberOrUndefined(text(param.price)) ?? numberOrUndefined(text(offer.price)) ?? 0,
              unit: text(param.priceUnit),
            },
            ...(toArray(param.characteristics?.characteristic).map((item: any) => ({
              name: text(item.name) ?? '',
              value: numberOrUndefined(text(item.value)) ?? text(item.value) ?? '',
              unit: text(item.unit),
            }))),
          ].filter((item) => item.name !== ''),
        }))
      : [
          {
            id: `${productId}_param_1`,
            characteristics: [{ name: 'Price', value: numberOrUndefined(text(offer.price)) ?? 0 }],
          },
        ];

    const modifers = toArray(offer.modifiersGroupsIds?.modifiersGroupId)
      .map((id) => text(id))
      .filter((id): id is string => Boolean(id));

    return {
      id: productId,
      name: text(offer.name) ?? '',
      description: text(offer.description),
      image: text(offer.picture),
      modifers,
      parameters,
    };
  }
}
