import { UniversalProductData } from '../domain/models';

const CSV_HEADERS = [
  'Артикул категории',
  'Категория',
  'Подкатегория',
  'Артикул товара',
  'Название',
  'Артикул параметра',
  'Цена',
  'Характеристика',
  'Значение характеристики',
  'Ед.Изм. характеристики',
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

export class TableBuilder {
  static build(data: UniversalProductData): string {
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
            firstParameter?.price ?? '',
            firstParameter?.characteristics?.[0]?.name ?? '',
            firstParameter?.characteristics?.[0]?.value ?? '',
            firstParameter?.characteristics?.[0]?.unit ?? '',
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
                '', '', '', '', '', '', '', '', '', '',
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
}
