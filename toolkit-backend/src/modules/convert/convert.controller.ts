/**
 * Convert controller - handles HTTP requests for file conversion
 */

import { Request, Response } from 'express';
import { ConvertService } from './convert.service';
import {
  ConfigResponseDto,
  ConvertResponseDto,
  ColumnType,
  ColumnMappingConfig,
} from './convert.dto';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 1024,
  },
});

export class ConvertController {
  private convertService: ConvertService;

  constructor() {
    this.convertService = new ConvertService();
  }

  getConfig = (req: Request, res: Response): void => {
    const inferParentTag = (domain: 'yml' | 'extended_yml' | 'google_feed', tag: string): string => {
      if (tag === 'category') return 'categories';
      if (domain === 'google_feed') return 'item';
      if (domain === 'extended_yml') {
        if (['modifier', 'name', 'price', 'vendor_code', 'sort'].includes(tag)) return 'item';
        return 'item';
      }
      return 'offer';
    };

    const xmlDomains = (
      domains: Partial<Record<'yml' | 'extended_yml' | 'google_feed', { parent_tag?: string; tag: string; attribute?: string }>>
    ): Partial<Record<'yml' | 'extended_yml' | 'google_feed', { parent_tag: string; tag: string; attribute?: string }>> =>
      Object.fromEntries(
        Object.entries(domains).map(([domain, config]) => [
          domain,
          {
            parent_tag: config!.parent_tag ?? inferParentTag(domain as 'yml' | 'extended_yml' | 'google_feed', config!.tag),
            tag: config!.tag,
            ...(config!.attribute ? { attribute: config!.attribute } : {}),
          },
        ])
      );

    const config: ConfigResponseDto = {
      supportedColumnTypes: [
        { value: ColumnType.CATEGORY_ID, label: 'Category ID', labelRu: 'Артикул/ID категории', description: 'Category article/ID', filter: [ "category" ], 
          domains: xmlDomains({
            yml: { parent_tag: 'categories', tag: 'category', attribute: 'id' },
            extended_yml: { parent_tag: 'categories', tag: 'category', attribute: 'id' },
            google_feed: { parent_tag: 'item', tag: 'g:google_product_category' },
          }), 
          priority: {
            universal: "primary",
            food: "primary",
            retail: "primary"
          }},
        { value: ColumnType.CATEGORY_NAME, label: 'Category', labelRu: 'Имя категории', description: 'Category name', filter: [ "category" ], 
          domains: xmlDomains({
            yml: { parent_tag: 'categories', tag: 'category' },
            extended_yml: { parent_tag: 'categories', tag: 'category' },
            google_feed: { parent_tag: 'item', tag: 'g:google_product_category' },
          }), 
          priority: {
            universal: "primary",
            food: "primary",
            retail: "primary"
          }},
        { value: ColumnType.SUBCATEGORY_NAME, label: 'Subcategory Name', labelRu: 'Имя подкатегории', description: 'Subcategory name', filter: [ "category" ], 
          domains: xmlDomains({
            yml: { parent_tag: 'categories', tag: 'category' },
            extended_yml: { parent_tag: 'categories', tag: 'category', attribute: 'parent_id' },
            google_feed: { parent_tag: 'item', tag: 'g:product_type' },
          }), 
          priority: {
            universal: "primary",
            food: "primary",
            retail: "primary"
          }},
        { value: ColumnType.SUBCATEGORY_ID, label: 'Subcategory ID', labelRu: 'Артикул/ID подкатегории', description: 'Subcategory article/ID', filter: [ "category" ], 
          domains: xmlDomains({
            yml: { parent_tag: 'categories', tag: 'category', attribute: 'parentId' },
            extended_yml: { parent_tag: 'categories', tag: 'category', attribute: 'parent_id' },
            google_feed: { parent_tag: 'item', tag: 'g:product_type' },
          }), 
          priority: {
            universal: "secondary",
            food: "secondary",
            retail: "secondary"
          }},
        { value: ColumnType.PRODUCT_ID, label: 'Product ID', labelRu: 'Артикул/ID товара', description: 'Product article/ID', filter: [ "product" ], 
          domains: xmlDomains({
            yml: { parent_tag: 'offer', tag: 'offer', attribute: 'id' },
            extended_yml: { parent_tag: 'item', tag: 'item', attribute: 'id' },
            google_feed: { parent_tag: 'item', tag: 'g:id' },
          }), 
          priority: {
            universal: "primary",
            food: "primary",
            retail: "primary"
          }},
        { value: ColumnType.PRODUCT_NAME, label: 'Product Name', labelRu: 'Имя товара', description: 'Name of the product', filter: [ "product" ], 
          domains: xmlDomains({
            yml: { parent_tag: 'offer', tag: 'name' },
            extended_yml: { parent_tag: 'item', tag: 'name' },
            google_feed: { parent_tag: 'item', tag: 'g:title' },
          }), 
          priority: {
            universal: "primary",
            food: "primary",
            retail: "primary"
          }},
        { value: ColumnType.PRODUCT_DESCRIPTION, label: 'Product Description', labelRu: 'Описание товара', description: 'Description of the product', filter: [ "product" ], 
          domains: xmlDomains({
            yml: { parent_tag: 'offer', tag: 'description' },
            extended_yml: { parent_tag: 'item', tag: 'description' },
            google_feed: { parent_tag: 'item', tag: 'g:description' },
          }), 
          priority: {
            universal: "primary",
            food: "primary",
            retail: "primary"
          }},
        { value: ColumnType.PRODUCT_IMAGE, label: 'Product Image', labelRu: 'Изображение товара', description: 'URL or path to product image', filter: [ "product" ], 
          domains: xmlDomains({
            yml: { parent_tag: 'offer', tag: 'picture' },
            extended_yml: { parent_tag: 'item.images', tag: 'large' },
            google_feed: { parent_tag: 'item', tag: 'g:image_link' },
          }), 
          priority: {
            universal: "secondary",
            food: "primary",
            retail: "primary"
          }},
        { value: ColumnType.PRODUCT_LINK, label: 'Product Link', labelRu: 'Ссылка на товар', description: 'URL to product page', filter: [ "product" ], 
          domains: xmlDomains({
            yml: { tag: 'url' },
            extended_yml: { tag: 'url' },
            google_feed: { tag: 'g:link' },
          }), 
          priority: {
            universal: "secondary",
            food: "secondary",
            retail: "secondary"
          }},
        { value: ColumnType.PRODUCT_PARAMETER_ID, label: 'Product Parameter ID', labelRu: 'ID параметра товара', description: 'ID of the product parameter', filter: [ "product" ], 
          domains: xmlDomains({
            yml: { tag: 'parameter', attribute: 'id' },
            extended_yml: { tag: 'parameter', attribute: 'id' },
            google_feed: { tag: 'g:id' },
          }), 
          priority: {
            universal: "secondary",
            food: "secondary",
            retail: "secondary"
          }},
        { value: ColumnType.PRODUCT_PARAMETER_CHARACTERISTIC, label: 'Product Parameter Characteristic', labelRu: 'Характеристика товара', description: 'Characteristic value column for product parameter', filter: [ "product" ], 
          domains: xmlDomains({
            yml: { tag: 'characteristic' },
            extended_yml: { tag: 'description' },
            google_feed: { tag: 'g:shipping_weight' },
          }), 
          priority: {
            universal: "primary",
            food: "primary",
            retail: "primary"
          }},
        { value: ColumnType.PRODUCT_PARAMETER_CHARACTERISTIC_UNIT, label: 'Product Parameter Characteristic Unit', labelRu: 'Ед.Изм. характеристики товара', description: 'Unit column for characteristic values', filter: [ "product" ], 
          domains: xmlDomains({
            yml: { tag: 'characteristic', attribute: 'unit' },
            extended_yml: { tag: 'description' },
            google_feed: { tag: 'g:shipping_weight' },
          }), 
          priority: {
            universal: "primary",
            food: "primary",
            retail: "primary"
          }},
        { value: ColumnType.PRODUCT_PARAMETER_PRICE, label: 'Product Parameter Price', labelRu: 'Цена товара', description: 'Price value for the product parameter', filter: [ "product" ], 
          domains: xmlDomains({
            yml: { tag: 'price' },
            extended_yml: { tag: 'price' },
            google_feed: { tag: 'g:price' },
          }), 
          priority: {
            universal: "primary",
            food: "primary",
            retail: "primary"
          }},
        { value: ColumnType.MODIFIER_GROUP_ID, label: 'Modifier Group ID', labelRu: 'ID группы модификаторов', description: 'ID of the modifier group', filter: [ "mod" ], 
          domains: xmlDomains({
            yml: { tag: 'modifiersGroup', attribute: 'id' },
            extended_yml: { tag: 'modifiers_group', attribute: 'id' },
          }), 
          priority: {
            universal: "secondary",
            food: "secondary",
            retail: "hidden"
          }},
        { value: ColumnType.MODIFIER_GROUP_NAME, label: 'Modifier Group Name', labelRu: 'Имя группы модификаторов', description: 'Name of the modifier group', filter: [ "mod" ], 
          domains: xmlDomains({
            yml: { tag: 'name' },
            extended_yml: { tag: 'name' },
          }), 
          priority: {
            universal: "secondary",
            food: "primary",
            retail: "hidden"
          }},
        { value: ColumnType.MODIFIER_GROUP_TYPE, label: 'Modifier Group Type', labelRu: 'Тип группы модификаторов', description: 'Selection type of the modifier group', filter: [ "mod" ], 
          domains: xmlDomains({
            yml: { tag: 'type' },
            extended_yml: { tag: 'type' },
          }), 
          priority: {
            universal: "secondary",
            food: "primary",
            retail: "hidden"
          }},
        { value: ColumnType.MODIFIER_GROUP_MAX_SELECT, label: 'Modifier Group Max Select', labelRu: 'Макс. выбор модификаторов', description: 'Maximum number of modifiers that can be selected', filter: [ "mod" ], 
          domains: xmlDomains({
            yml: { tag: 'maximum' },
            extended_yml: { tag: 'maximum' },
          }), 
          priority: {
            universal: "secondary",
            food: "secondary",
            retail: "hidden"
          }},
        { value: ColumnType.MODIFIER_GROUP_MIN_SELECT, label: 'Modifier Group Min Select', labelRu: 'Мин. выбор модификаторов', description: 'Minimum number of modifiers that must be selected', filter: [ "mod" ], 
          domains: xmlDomains({
            yml: { tag: 'minimum' },
            extended_yml: { tag: 'minimum' },
          }), 
          priority: {
            universal: "secondary",
            food: "secondary",
            retail: "hidden"
          }},
        { value: ColumnType.MODIFIER_ID, label: 'Modifier ID', labelRu: 'ID модификатора', description: 'ID of the modifier', filter: [ "mod" ], 
          domains: xmlDomains({
            yml: { tag: 'modifier', attribute: 'id' },
            extended_yml: { tag: 'modifier', attribute: 'id' },
          }), 
          priority: {
            universal: "secondary",
            food: "secondary",
            retail: "hidden"
          }},
        { value: ColumnType.MODIFIER_NAME, label: 'Modifier Name', labelRu: 'Имя модификатора', description: 'Name of the modifier', filter: [ "mod" ], 
          domains: xmlDomains({
            yml: { tag: 'name' },
            extended_yml: { tag: 'name' },
          }), 
          priority: {
            universal: "secondary",
            food: "primary",
            retail: "hidden"
          }},
        { value: ColumnType.MODIFIER_PRICE, label: 'Modifier Price', labelRu: 'Цена модификатора', description: 'Price of the modifier', filter: [ "mod" ], 
          domains: xmlDomains({
            yml: { tag: 'price' },
            extended_yml: { tag: 'price' },
          }), 
          priority: {
            universal: "secondary",
            food: "primary",
            retail: "hidden"
          }},
        { value: ColumnType.PRODUCT_VENDOR_CODE, label: 'Product Vendor Code', labelRu: 'Внешний код товара', description: 'External vendor code of product', filter: [ "product" ], 
          domains: xmlDomains({
            yml: { tag: 'vendorCode' },
            extended_yml: { tag: 'vendor_code' },
            google_feed: { tag: 'g:mpn' },
          }), 
          priority: {
            universal: "secondary",
            food: "secondary",
            retail: "primary"
          }},
        { value: ColumnType.PRODUCT_LABEL_ID, label: 'Product Label ID', labelRu: 'ID метки товара', description: 'Label id attached to product', filter: [ "product" ], 
          domains: xmlDomains({
            extended_yml: { tag: 'label_id' },
          }), 
          priority: {
            universal: "hidden",
            food: "secondary",
            retail: "hidden"
          }},
        { value: ColumnType.PRODUCT_SORT, label: 'Product Sort', labelRu: 'Порядок отображения товара', description: 'Sort order for product rendering', filter: [ "product" ], 
          domains: xmlDomains({
            extended_yml: { tag: 'sort' },
          }), 
          priority: {
            universal: "hidden",
            food: "secondary",
            retail: "hidden"
          }},
        { value: ColumnType.PRODUCT_PARAMETER_DESCRIPTION, label: 'Product Parameter Description', labelRu: 'Описание параметра товара', description: 'Description of a product parameter', filter: [ "product" ], 
          domains: xmlDomains({
            yml: { tag: 'characteristic' },
            extended_yml: { tag: 'description' },
          }), 
          priority: {
            universal: "secondary",
            food: "primary",
            retail: "secondary"
          }},
        { value: ColumnType.PRODUCT_PARAMETER_VENDOR_CODE, label: 'Product Parameter Vendor Code', labelRu: 'Внешний код параметра', description: 'External vendor code of parameter', filter: [ "product" ], 
          domains: xmlDomains({
            extended_yml: { tag: 'vendor_code' },
          }), 
          priority: {
            universal: "hidden",
            food: "secondary",
            retail: "secondary"
          }},
        { value: ColumnType.PRODUCT_PARAMETER_SORT, label: 'Product Parameter Sort', labelRu: 'Порядок отображения параметра', description: 'Sort order of parameter option', filter: [ "product" ], 
          domains: xmlDomains({
            extended_yml: { tag: 'sort' },
          }), 
          priority: {
            universal: "hidden",
            food: "secondary",
            retail: "hidden"
          }},
        { value: ColumnType.PRODUCT_PARAMETER_PROTEINS, label: 'Product Parameter Proteins', labelRu: 'Белки параметра', description: 'Proteins value of parameter', filter: [ "product" ], 
          domains: xmlDomains({
            extended_yml: { tag: 'proteins' },
          }), 
          priority: {
            universal: "hidden",
            food: "secondary",
            retail: "hidden"
          }},
        { value: ColumnType.PRODUCT_PARAMETER_FATS, label: 'Product Parameter Fats', labelRu: 'Жиры параметра', description: 'Fats value of parameter', filter: [ "product" ], 
          domains: xmlDomains({
            extended_yml: { tag: 'fats' },
          }), 
          priority: {
            universal: "hidden",
            food: "secondary",
            retail: "hidden"
          }},
        { value: ColumnType.PRODUCT_PARAMETER_CARBOHYDRATES, label: 'Product Parameter Carbohydrates', labelRu: 'Углеводы параметра', description: 'Carbohydrates value of parameter', filter: [ "product" ], 
          domains: xmlDomains({
            extended_yml: { tag: 'carbohydrates' },
          }), 
          priority: {
            universal: "hidden",
            food: "secondary",
            retail: "hidden"
          }},
        { value: ColumnType.PRODUCT_PARAMETER_CALORIES, label: 'Product Parameter Calories', labelRu: 'Калории параметра', description: 'Calories value of parameter', filter: [ "product" ], 
          domains: xmlDomains({
            extended_yml: { tag: 'calories' },
          }), 
          priority: {
            universal: "hidden",
            food: "secondary",
            retail: "hidden"
          }},
        { value: ColumnType.MODIFIER_GROUP_REQUIRED, label: 'Modifier Group Required', labelRu: 'Обязательность группы', description: 'Is modifier group required', filter: [ "mod" ], 
          domains: xmlDomains({
            extended_yml: { tag: 'modifiers_group', attribute: 'required' },
          }), 
          priority: {
            universal: "hidden",
            food: "secondary",
            retail: "hidden"
          }},
        { value: ColumnType.MODIFIER_GROUP_SORT, label: 'Modifier Group Sort', labelRu: 'Порядок группы модификаторов', description: 'Sort order for modifier group', filter: [ "mod" ], 
          domains: xmlDomains({
            extended_yml: { tag: 'sort' },
          }), 
          priority: {
            universal: "hidden",
            food: "secondary",
            retail: "hidden"
          }},
        { value: ColumnType.MODIFIER_VENDOR_CODE, label: 'Modifier Vendor Code', labelRu: 'Внешний код модификатора', description: 'External vendor code of modifier', filter: [ "mod" ], 
          domains: xmlDomains({
            extended_yml: { tag: 'vendor_code' },
          }), 
          priority: {
            universal: "hidden",
            food: "secondary",
            retail: "hidden"
          }},
        { value: ColumnType.MODIFIER_SORT, label: 'Modifier Sort', labelRu: 'Порядок модификатора', description: 'Sort order in modifier group', filter: [ "mod" ], 
          domains: xmlDomains({
            extended_yml: { tag: 'sort' },
          }), 
          priority: {
            universal: "secondary",
            food: "secondary",
            retail: "hidden"
          }},
      ],
      supportedOutputFormats: [
        { value: 'table', label: 'Таблица (CSV)' },
        { value: 'yml', label: 'YML' },
        { value: 'extended_yml', label: 'Расширенный food yml' },
        { value: 'google_feed', label: 'Google Feed XML' },
      ],
    };

    res.json(config);
  };

  convert = async (req: Request, res: Response): Promise<void> => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ success: false, error: 'No file uploaded' } as ConvertResponseDto);
        return;
      }

      const sourceType = (req.body.sourceType as string | undefined) ?? 'table';
      const targetType = (req.body.targetType as string | undefined) ?? 'yml';

      if (!this.convertService.validateSourceType(sourceType)) {
        res.status(400).json({ success: false, error: `Unsupported sourceType: ${sourceType}` } as ConvertResponseDto);
        return;
      }

      if (!this.convertService.validateTargetType(targetType)) {
        res.status(400).json({ success: false, error: `Unsupported targetType: ${targetType}` } as ConvertResponseDto);
        return;
      }

      let mappings: ColumnMappingConfig = { columns: [], characteristic: [] };
      if (req.body.mappings) {
        try {
          mappings = typeof req.body.mappings === 'string' ? JSON.parse(req.body.mappings) : req.body.mappings;
        } catch {
          res.status(400).json({ success: false, error: 'Invalid mappings JSON' } as ConvertResponseDto);
          return;
        }
      }

      const built = await this.convertService.convertByConfig({
        fileBuffer: file.buffer,
        mimeType: file.mimetype,
        filename: file.originalname,
        sourceType,
        targetType,
        mappings,
      });

      res.setHeader('Content-Type', built.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${built.filename}"`);
      res.send(built.content);
      return;

    } catch (error: any) {
      console.error('Convert error:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' } as ConvertResponseDto);
    }
  };

  uploadMiddleware = upload.single('file');
}
