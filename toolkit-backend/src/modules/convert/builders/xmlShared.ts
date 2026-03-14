import { UniversalProductData } from '../domain/models';

export const createShopPayload = (data: UniversalProductData) => {
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
      url: product.link ?? '',
      name: product.name,
      description: product.description ?? '',
      picture: product.image ?? '',
      parameters: {
        parameter: product.parameters.map((parameter) => ({
          $: { id: parameter.id },
          price: parameter.price,
          characteristics: {
            characteristic: (parameter.characteristics ?? []).map((characteristic) => ({
              name: characteristic.name,
              value: characteristic.value,
              unit: characteristic.unit ?? '',
            })),
          },
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
};
