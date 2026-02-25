/**
 * Convert controller - handles HTTP requests for file conversion
 */

import { Request, Response } from 'express';
import { ConvertService, SourceType } from './convert.service';
import {
  ConfigResponseDto,
  ConvertResponseDto,
  ColumnType,
  ColumnMapping,
} from './convert.dto';
import multer from 'multer';
import { TargetType } from './builders/outputBuilders';

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
    const config: ConfigResponseDto = {
      supportedColumnTypes: [
        { value: ColumnType.CATEGORY_ID, label: 'Category ID', labelRu: 'ID категории', description: 'ID of the category' },
        { value: ColumnType.CATEGORY_NAME, label: 'Category', labelRu: 'Имя категории', description: 'Product category name' },
        { value: ColumnType.CATEGORY_PARENT, label: 'Category Parent', labelRu: 'Родительская категория', description: 'Parent category name (for nested categories)' },
        { value: ColumnType.SUBCATEGORY_NAME, label: 'Subcategory Name', labelRu: 'Имя подкатегории', description: 'Subcategory name' },
        { value: ColumnType.SUBCATEGORY_ID, label: 'Subcategory ID', labelRu: 'ID подкатегории', description: 'ID of the subcategory' },
        { value: ColumnType.PRODUCT_ID, label: 'Product ID', labelRu: 'ID товара', description: 'ID of the product' },
        { value: ColumnType.PRODUCT_NAME, label: 'Product Name', labelRu: 'Имя товара', description: 'Name of the product' },
        { value: ColumnType.PRODUCT_DESCRIPTION, label: 'Product Description', labelRu: 'Описание товара', description: 'Description of the product' },
        { value: ColumnType.PRODUCT_IMAGE, label: 'Product Image', labelRu: 'Изображение товара', description: 'URL or path to product image' },
        { value: ColumnType.PRODUCT_LINK, label: 'Product Link', labelRu: 'Ссылка на товар', description: 'URL to product page' },
        { value: ColumnType.PRODUCT_PARAMETER_ID, label: 'Product Parameter ID', labelRu: 'ID параметра товара', description: 'ID of the product parameter' },
        { value: ColumnType.PRODUCT_PARAMETER_WEIGHT, label: 'Product Weight', labelRu: 'Вес товара', description: 'Weight value for the product parameter' },
        { value: ColumnType.PRODUCT_PARAMETER_WEIGHT_UNIT, label: 'Product Weight Unit', labelRu: 'Ед.Изм. веса', description: 'Unit of measurement for the product weight' },
        { value: ColumnType.PRODUCT_PARAMETER_PRICE, label: 'Product Price', labelRu: 'Цена товара', description: 'Price for the product parameter' },
        { value: ColumnType.PRODUCT_PARAMETER_OLD_PRICE, label: 'Product Old Price', labelRu: 'Старая цена товара', description: 'Old price for the product parameter' },
        { value: ColumnType.PRODUCT_PARAMETER_PRICE_UNIT, label: 'Product Price Unit', labelRu: 'Единица измерения цены товара', description: 'Unit of measurement for the product price' },
        { value: ColumnType.PRODUCT_PARAMETER_PROTEINS, label: 'Product Proteins', labelRu: 'Белки', description: 'Proteins value for the product parameter' },
        { value: ColumnType.PRODUCT_PARAMETER_FATS, label: 'Product Fats', labelRu: 'Жиры', description: 'Fats value for the product parameter' },
        { value: ColumnType.PRODUCT_PARAMETER_CARBOHYDRATES, label: 'Product Carbohydrates', labelRu: 'Углеводы', description: 'Carbohydrates value for the product parameter' },
        { value: ColumnType.PRODUCT_PARAMETER_CALORIES, label: 'Product Calories', labelRu: 'Калории', description: 'Calories value for the product parameter' },
        { value: ColumnType.PRODUCT_PARAMETER_ENERGY_VALUE, label: 'Product Energy Value', labelRu: 'Энергетическая ценность', description: 'Energy value for the product parameter' },
        { value: ColumnType.MODIFIER_GROUP_ID, label: 'Modifier Group ID', labelRu: 'ID группы модификаторов', description: 'ID of the modifier group' },
        { value: ColumnType.MODIFIER_GROUP_NAME, label: 'Modifier Group Name', labelRu: 'Имя группы модификаторов', description: 'Name of the modifier group' },
        { value: ColumnType.MODIFIER_GROUP_MAX_SELECT, label: 'Modifier Group Max Select', labelRu: 'Макс. выбор модификаторов', description: 'Maximum number of modifiers that can be selected' },
        { value: ColumnType.MODIFIER_GROUP_MIN_SELECT, label: 'Modifier Group Min Select', labelRu: 'Мин. выбор модификаторов', description: 'Minimum number of modifiers that must be selected' },
        { value: ColumnType.MODIFIER_ID, label: 'Modifier ID', labelRu: 'ID модификатора', description: 'ID of the modifier' },
        { value: ColumnType.MODIFIER_NAME, label: 'Modifier Name', labelRu: 'Имя модификатора', description: 'Name of the modifier' },
        { value: ColumnType.MODIFIER_PRICE, label: 'Modifier Price', labelRu: 'Цена модификатора', description: 'Price of the modifier' },
      ],
      supportedOutputFormats: [
        { value: 'table', label: 'Таблица (CSV)' },
        { value: 'yml', label: 'YML XML' },
        { value: 'delivery_club', label: 'Delivery Club XML' },
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

      const sourceType = (req.body.sourceType as SourceType | undefined) ?? 'table';
      const targetType = req.body.targetType as TargetType | undefined;

      let mappings: ColumnMapping[] = [];
      if (req.body.mappings) {
        mappings = typeof req.body.mappings === 'string' ? JSON.parse(req.body.mappings) : req.body.mappings;
      }

      if (targetType) {
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
      }

      const built = await this.convertService.convertByConfig({
        fileBuffer: file.buffer,
        mimeType: file.mimetype,
        filename: file.originalname,
        sourceType,
        targetType: 'yml',
        mappings,
      });

      res.setHeader('Content-Type', built.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${built.filename}"`);
      res.send(built.content);
    } catch (error: any) {
      console.error('Convert error:', error);
      res.status(500).json({ success: false, error: error.message || 'Internal server error' } as ConvertResponseDto);
    }
  };

  uploadMiddleware = upload.single('file');
}
