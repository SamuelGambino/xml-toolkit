import * as xml2js from 'xml2js';
import { UniversalProductData } from '../domain/models';
import { ColumnType } from '../convert.dto';
import { getXmlFieldConfig } from './xmlFieldConfig';

const formatYmlDate = (date: Date): string => {
  const pad = (v: number) => String(v).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export class YmlBuilder {
  static build(data: UniversalProductData): string {
    const productIdCfg = getXmlFieldConfig('yml', ColumnType.PRODUCT_ID);
    const productNameCfg = getXmlFieldConfig('yml', ColumnType.PRODUCT_NAME);
    const productDescriptionCfg = getXmlFieldConfig('yml', ColumnType.PRODUCT_DESCRIPTION);
    const productImageCfg = getXmlFieldConfig('yml', ColumnType.PRODUCT_IMAGE);
    const productLinkCfg = getXmlFieldConfig('yml', ColumnType.PRODUCT_LINK);
    const productPriceCfg = getXmlFieldConfig('yml', ColumnType.PRODUCT_PARAMETER_PRICE);
    const categoryIdCfg = getXmlFieldConfig('yml', ColumnType.CATEGORY_ID);

    const offers: any[] = [];
    data.categories.forEach((category) => {
      category.products.forEach((product) => {
        if (!product.parameters.length) {
          offers.push({
            $: { [productIdCfg?.attribute ?? 'id']: product.id, available: 'true' },
            [productLinkCfg?.tag ?? 'url']: product.link ?? '',
            [productPriceCfg?.tag ?? 'price']: 0,
            categoryId: category.id,
            [productImageCfg?.tag ?? 'picture']: product.image ?? '',
            [productNameCfg?.tag ?? 'name']: product.name,
            [productDescriptionCfg?.tag ?? 'description']: product.description ?? '',
          });
          return;
        }

        product.parameters.forEach((parameter) => {
          const params = (parameter.characteristics ?? []).map((characteristic) => ({
            $: {
              name: characteristic.name,
              ...(characteristic.unit ? { unit: characteristic.unit } : {}),
            },
            _: String(characteristic.value ?? ''),
          }));

          offers.push({
            $: {
              [productIdCfg?.attribute ?? 'id']: parameter.id || product.id,
              group_id: product.id,
              available: 'true',
            },
            [productLinkCfg?.tag ?? 'url']: product.link ?? '',
            [productPriceCfg?.tag ?? 'price']: parameter.price ?? 0,
            categoryId: category.id,
            [productImageCfg?.tag ?? 'picture']: product.image ?? '',
            [productNameCfg?.tag ?? 'name']: product.name,
            [productDescriptionCfg?.tag ?? 'description']: product.description ?? '',
            ...(params.length > 0 ? { param: params } : {}),
          });
        });
      });
    });

    const categories = data.categories.map((category) => ({
      $: {
        [categoryIdCfg?.attribute ?? 'id']: category.id,
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
