import * as xml2js from 'xml2js';
import { ProductParameter, UniversalProductData } from '../domain/models';
import { ColumnType } from '../convert.dto';
import { getXmlFieldConfig } from './xmlFieldConfig';

const formatYmlDate = (date: Date): string => {
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const normalizeDescriptionFromCharacteristics = (parameter: ProductParameter): string | undefined => {
  const parts = (parameter.characteristics ?? [])
    .filter((characteristic) => characteristic.name !== 'Price')
    .map((characteristic) => {
      const raw = String(characteristic.value ?? '').trim();
      if (!raw) return '';
      return characteristic.unit ? `${raw} ${characteristic.unit}` : raw;
    })
    .filter(Boolean);

  if (!parts.length) return undefined;
  return parts.join(', ');
};

export class ExtendedYmlBuilder {
  static build(data: UniversalProductData): string {
    const categoryIdCfg = getXmlFieldConfig('extended_yml', ColumnType.CATEGORY_ID);
    const productIdCfg = getXmlFieldConfig('extended_yml', ColumnType.PRODUCT_ID);
    const productNameCfg = getXmlFieldConfig('extended_yml', ColumnType.PRODUCT_NAME);
    const productDescriptionCfg = getXmlFieldConfig('extended_yml', ColumnType.PRODUCT_DESCRIPTION);
    const productImageCfg = getXmlFieldConfig('extended_yml', ColumnType.PRODUCT_IMAGE);
    const productParamIdCfg = getXmlFieldConfig('extended_yml', ColumnType.PRODUCT_PARAMETER_ID);
    const productPriceCfg = getXmlFieldConfig('extended_yml', ColumnType.PRODUCT_PARAMETER_PRICE);

    const categories = data.categories.map((category) => ({
      $: {
        [categoryIdCfg?.attribute ?? 'id']: category.id,
        ...(category.parentId ? { parent_id: category.parentId } : {}),
      },
      _: category.name,
    }));

    const modifiersGroups = data.modifierGroups.map((group) => ({
      $: { id: group.id },
      name: group.name,
      type: group.type ?? '',
      minimum: group.minSelect ?? 0,
      maximum: group.maxSelect ?? 0,
    }));

    const modifiers = data.modifierGroups.flatMap((group) =>
      group.modifiers.map((modifier) => ({
        $: { id: modifier.id },
        name: modifier.name,
        price: modifier.price,
        modifiers_group_id: group.id,
      }))
    );

    const items = data.categories.flatMap((category) =>
      category.products.map((product) => ({
        $: { [productIdCfg?.attribute ?? 'id']: product.id },
        [productNameCfg?.tag ?? 'name']: product.name,
        category_id: category.id,
        [productDescriptionCfg?.tag ?? 'description']: product.description ?? '',
        ...(product.image
          ? {
              images: {
                [productImageCfg?.tag ?? 'large']: product.image,
              },
            }
          : {}),
        ...(product.modifers.length
          ? {
              modifiers_groups_ids: {
                modifiers_group_id: product.modifers,
              },
            }
          : {}),
        parameters: {
          parameter: (product.parameters.length ? product.parameters : [{ id: `${product.id}_param_1`, price: 0 }]).map(
            (parameter, index) => {
              const parameterDescription = normalizeDescriptionFromCharacteristics(parameter);
              return {
                $: { [productParamIdCfg?.attribute ?? 'id']: parameter.id || `${product.id}_param_${index + 1}` },
                [productPriceCfg?.tag ?? 'price']: parameter.price ?? 0,
                ...(parameterDescription ? { description: parameterDescription } : {}),
              };
            }
          ),
        },
      }))
    );

    const payload = {
      yml_catalog: {
        $: { date: formatYmlDate(new Date()) },
        shop: {
          name: 'Organization name',
          company: 'Company name',
          url: 'https://example.com',
          currencies: {
            currency: { $: { id: 'RUR', rate: '1' } },
          },
          modifiers_groups: {
            modifiers_group: modifiersGroups,
          },
          modifiers: {
            modifier: modifiers,
          },
          categories: {
            category: categories,
          },
          items: {
            item: items,
          },
        },
      },
    };

    const builder = new xml2js.Builder({ headless: false, cdata: true });
    return builder.buildObject(payload);
  }
}
