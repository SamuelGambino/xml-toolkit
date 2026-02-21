import * as xml2js from 'xml2js';
import { UniversalProductData } from '../domain/models';

export type TargetType = 'table' | 'yml' | 'delivery_club' | 'google_feed';

export interface BuiltFile {
  filename: string;
  mimeType: string;
  content: string;
}

const CSV_HEADERS = [
  'Артикул категории',
  'Категория',
  'Подкатегория',
  'Артикул товара',
  'Название',
  'Артикул параметра',
  'Вес',
  'Ед.Изм.',
  'Цена',
  'Старая цена',
  'Валюта',
  'Белки',
  'Жиры',
  'Углеводы',
  'Энерг. ценность',
  'Артикул группы мод.',
  'группа модификаторов',
  'min модификаторов',
  'max модификаторов',
  'Артикул модификаторов',
  'модификаторы',
  'цена модификатора',
  'Описание',
  'Изображение',
];

const csvEscape = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

export class OutputBuilders {
  static build(data: UniversalProductData, targetType: TargetType): BuiltFile {
    switch (targetType) {
      case 'table':
        return {
          filename: 'converted.csv',
          mimeType: 'text/csv; charset=utf-8',
          content: this.toCsv(data),
        };
      case 'yml':
        return {
          filename: 'converted-yml.xml',
          mimeType: 'application/xml; charset=utf-8',
          content: this.toYmlXml(data),
        };
      case 'delivery_club':
        return {
          filename: 'converted-delivery-club.xml',
          mimeType: 'application/xml; charset=utf-8',
          content: this.toDcXml(data),
        };
      case 'google_feed':
        return {
          filename: 'converted-google-feed.xml',
          mimeType: 'application/xml; charset=utf-8',
          content: this.toGoogleXml(data),
        };
      default:
        throw new Error(`Unsupported targetType: ${targetType}`);
    }
  }

  private static toCsv(data: UniversalProductData): string {
    const rows: string[] = [CSV_HEADERS.map(csvEscape).join(',')];

    data.categories.forEach((category) => {
      category.products.forEach((product) => {
        const firstParameter = product.parameters[0];
        const productModGroupIds = product.modifers;

        rows.push(
          [
            category.id,
            category.name,
            category.parentId ?? '',
            product.id,
            product.name,
            firstParameter?.id ?? '',
            firstParameter?.weight ?? '',
            firstParameter?.weightUnit ?? '',
            firstParameter?.price ?? '',
            firstParameter?.oldPrice ?? '',
            firstParameter?.priceUnit ?? '',
            firstParameter?.proteins ?? '',
            firstParameter?.fats ?? '',
            firstParameter?.carbohydrates ?? '',
            firstParameter?.energyValue ?? '',
            productModGroupIds[0] ?? '',
            data.modifierGroups.find((g) => g.id === productModGroupIds[0])?.name ?? '',
            data.modifierGroups.find((g) => g.id === productModGroupIds[0])?.minSelect ?? '',
            data.modifierGroups.find((g) => g.id === productModGroupIds[0])?.maxSelect ?? '',
            '',
            '',
            '',
            product.description ?? '',
            product.image ?? '',
          ]
            .map(csvEscape)
            .join(',')
        );

        productModGroupIds.forEach((groupId) => {
          const group = data.modifierGroups.find((g) => g.id === groupId);
          if (!group) return;
          group.modifiers.forEach((modifier) => {
            rows.push(
              [
                '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
                group.id,
                group.name,
                group.minSelect ?? '',
                group.maxSelect ?? '',
                modifier.id,
                modifier.name,
                modifier.price,
                '',
                '',
              ]
                .map(csvEscape)
                .join(',')
            );
          });
        });
      });
    });

    return rows.join('\n');
  }

  private static toYmlXml(data: UniversalProductData): string {
    const payload = {
      yml_catalog: {
        $: { date: new Date().toISOString() },
        shop: this.shopPayload(data),
      },
    };
    const builder = new xml2js.Builder({ headless: false });
    return builder.buildObject(payload);
  }

  private static toDcXml(data: UniversalProductData): string {
    const payload = {
      dc_catalog: {
        $: { date: new Date().toISOString() },
        shop: this.shopPayload(data),
      },
    };
    const builder = new xml2js.Builder({ headless: false });
    return builder.buildObject(payload);
  }

  private static toGoogleXml(data: UniversalProductData): string {
    const items = data.categories.flatMap((category) =>
      category.products.map((product) => {
        const param = product.parameters[0];
        return {
          'g:id': product.id,
          'g:title': product.name,
          'g:description': product.description ?? '',
          'g:link': '',
          'g:image_link': product.image ?? '',
          'g:price': `${param?.price ?? 0} ${param?.priceUnit ?? 'RUB'}`,
          'g:availability': 'in stock',
          'g:google_product_category': category.name,
        };
      })
    );

    const payload = {
      rss: {
        $: {
          version: '2.0',
          'xmlns:g': 'http://base.google.com/ns/1.0',
        },
        channel: {
          title: 'Converted feed',
          link: 'https://example.com',
          description: 'Generated by xml-toolkit',
          item: items,
        },
      },
    };

    const builder = new xml2js.Builder({ headless: false });
    return builder.buildObject(payload);
  }

  private static shopPayload(data: UniversalProductData) {
    const categories = data.categories.map((category) => ({
      $: {
        id: category.id,
        ...(category.parentId ? { parentId: category.parentId } : {}),
      },
      _: category.name,
    }));

    const offers = data.categories.flatMap((category) =>
      category.products.map((product) => ({
        $: { id: product.id, available: 'true' },
        name: product.name,
        description: product.description ?? '',
        picture: product.image ?? '',
        parameters: {
          parameter: product.parameters.map((parameter) => ({
            $: { id: parameter.id },
            weight: parameter.weight,
            weightUnit: parameter.weightUnit ?? '',
            price: parameter.price,
            oldPrice: parameter.oldPrice ?? '',
            priceUnit: parameter.priceUnit ?? '',
            proteins: parameter.proteins ?? '',
            fats: parameter.fats ?? '',
            carbohydrates: parameter.carbohydrates ?? '',
            calories: parameter.calories ?? '',
            energyValue: parameter.energyValue ?? '',
          })),
        },
        categoryId: category.id,
        modifiersGroupsIds: {
          modifiersGroupId: product.modifers,
        },
      }))
    );

    return {
      name: 'Organization name',
      company: 'Company name',
      url: 'https://example.com',
      currencies: {
        currency: { $: { id: 'RUR', rate: '1' } },
      },
      modifiersGroups: {
        modifiersGroup: data.modifierGroups.map((group) => ({
          $: { id: group.id },
          name: group.name,
          type: group.type ?? '',
          minimum: group.minSelect ?? '',
          maximum: group.maxSelect ?? '',
        })),
      },
      modifiers: {
        modifier: data.modifierGroups.flatMap((group) =>
          group.modifiers.map((modifier) => ({
            $: { id: modifier.id, required: 'true' },
            name: modifier.name,
            price: modifier.price,
            modifiersGroupId: group.id,
          }))
        ),
      },
      categories: { category: categories },
      offers: { offer: offers },
    };
  }
}
