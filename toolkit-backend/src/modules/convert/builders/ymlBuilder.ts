import * as xml2js from 'xml2js';
import { UniversalProductData } from '../domain/models';

const formatYmlDate = (date: Date): string => {
  const pad = (v: number) => String(v).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export class YmlBuilder {
  static build(data: UniversalProductData): string {
    const offers = data.categories.flatMap((category) =>
      category.products.flatMap((product) => {
        if (!product.parameters.length) {
          return {
            $: { id: product.id, available: 'true' },
            url: product.link ?? '',
            price: 0,
            categoryId: category.id,
            picture: product.image ?? '',
            name: product.name,
            description: product.description ?? '',
          };
        }

        return product.parameters.map((parameter) => {
          const params = (parameter.characteristics ?? []).map((characteristic) => ({
            $: {
              name: characteristic.name,
              ...(characteristic.unit ? { unit: characteristic.unit } : {}),
            },
            _: String(characteristic.value ?? ''),
          }));

          return {
            $: {
              id: parameter.id || product.id,
              group_id: product.id,
              available: 'true',
            },
            url: product.link ?? '',
            price: parameter.price ?? 0,
            categoryId: category.id,
            picture: product.image ?? '',
            name: product.name,
            description: product.description ?? '',
            ...(params.length > 0 ? { param: params } : {}),
          };
        });
      })
    );

    const categories = data.categories.map((category) => ({
      $: {
        id: category.id,
        ...(category.parentId ? { parentId: category.parentId } : {}),
      },
      _: category.name,
    }));

    const payload = {
      yml_catalog: {
        $: { date: formatYmlDate(new Date()) },
        shop: {
          name: 'Example',
          company: 'LLC Example',
          url: 'https://example.com',
          currencies: {},
          categories: { category: categories },
          offers: { offer: offers },
        },
      },
    };

    const builder = new xml2js.Builder({ headless: false, cdata: true });
    return builder.buildObject(payload);
  }
}
