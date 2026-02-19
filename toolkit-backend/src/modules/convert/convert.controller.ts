/**
 * Convert controller - handles HTTP requests for file conversion
 */

import { Request, Response } from 'express';
import { ConvertService } from './convert.service';
import {
  ConfigResponseDto,
  ConvertRequestDto,
  ConvertResponseDto,
  ColumnType,
  ColumnMapping,
} from './convert.dto';
import multer from 'multer';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB limit
  },
});

export class ConvertController {
  private convertService: ConvertService;

  constructor() {
    this.convertService = new ConvertService();
  }

  /**
   * GET /api/config/convert
   * Returns supported column types for mapping
   */
  getConfig = (req: Request, res: Response): void => {
    const config: ConfigResponseDto = {
      supportedColumnTypes: [
        { value: ColumnType.CATEGORY, label: 'Category', labelRu: 'Имя категории', description: 'Product category name' },
        { value: ColumnType.CATEGORY_PARENT, label: 'Category Parent', labelRu: 'Имя подкатегории', description: 'Parent category name (for nested categories)' },
        { value: ColumnType.PRODUCT_NAME, label: 'Product Name', labelRu: 'Имя товара', description: 'Name of the product' },
        { value: ColumnType.PRODUCT_DESCRIPTION, label: 'Product Description', labelRu: 'Описание товара', description: 'Description of the product' },
        { value: ColumnType.PRODUCT_IMAGE, label: 'Product Image', labelRu: 'Изображение товара', description: 'URL or path to product image' },
        { value: ColumnType.MODIFIER_GROUP_NAME, label: 'Modifier Group Name', labelRu: 'Имя группы модификаторов', description: 'Name of the modifier group' },
        { value: ColumnType.MODIFIER_GROUP_TYPE, label: 'Modifier Group Type', labelRu: 'Тип группы модификаторов', description: 'Type of the modifier group' },
        { value: ColumnType.MODIFIER_GROUP_MAX_SELECT, label: 'Modifier Group Max Select', labelRu: 'Макс. выбор модификаторов', description: 'Maximum number of modifiers that can be selected' },
        { value: ColumnType.MODIFIER_GROUP_MIN_SELECT, label: 'Modifier Group Min Select', labelRu: 'Мин. выбор модификаторов', description: 'Minimum number of modifiers that must be selected' },
        { value: ColumnType.MODIFIER_NAME, label: 'Modifier Name', labelRu: 'Имя модификатора', description: 'Name of the modifier' },
        { value: ColumnType.MODIFIER_PRICE, label: 'Modifier Price', labelRu: 'Цена модификатора', description: 'Price of the modifier' },
        { value: ColumnType.PRODUCT_PARAMETER_ID, label: 'Product Parameter ID', labelRu: 'ID параметра товара', description: 'ID of the product parameter' },
        { value: ColumnType.PRODUCT_PARAMETER_WEIGHT, label: 'Product Parameter Weight', labelRu: 'Вес параметра товара', description: 'Weight value for the product parameter' },
        { value: ColumnType.PRODUCT_PARAMETER_PRICE, label: 'Product Parameter Price', labelRu: 'Цена параметра товара', description: 'Price for the product parameter' },
      ],
    };

    res.json(config);
  };

  /**
   * POST /api/config/convert
   * Converts uploaded file to universal format based on column mappings
   */
  convert = async (req: Request, res: Response): Promise<void> => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded',
        } as ConvertResponseDto);
        return;
      }

      // Parse mappings from form data (could be JSON string or object)
      let mappings: ColumnMapping[];
      try {
        if (typeof req.body.mappings === 'string') {
          mappings = JSON.parse(req.body.mappings);
        } else {
          mappings = req.body.mappings;
        }
      } catch (error) {
        res.status(400).json({
          success: false,
          error: 'Invalid mappings format: must be valid JSON',
        } as ConvertResponseDto);
        return;
      }

      if (!mappings || !Array.isArray(mappings)) {
        res.status(400).json({
          success: false,
          error: 'Invalid mappings: must be an array',
        } as ConvertResponseDto);
        return;
      }

      // Validate mappings
      const validation = this.convertService.validateMappings(mappings);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: validation.error,
        } as ConvertResponseDto);
        return;
      }

      // Create readable stream from buffer
      const fileStream = new Readable();
      fileStream.push(file.buffer);
      fileStream.push(null); // End of stream

      // Convert file
      console.log('Starting file conversion...', {
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        mappingsCount: mappings.length,
      });

      const result = await this.convertService.convertFile(
        fileStream,
        file.mimetype,
        file.originalname,
        mappings
      );

      console.log('Conversion completed:', {
        categoriesCount: result.categories.length,
        modifierGroupsCount: result.modifierGroups.length,
        totalProducts: result.categories.reduce((sum, cat) => sum + cat.products.length, 0),
      });

      // Save result to file for debugging
      try {
        const debugDir = path.join(process.cwd(), 'debug-output');
        if (!fs.existsSync(debugDir)) {
          fs.mkdirSync(debugDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `converted_${path.parse(file.originalname).name}_${timestamp}.json`;
        const filePath = path.join(debugDir, fileName);

        fs.writeFileSync(
          filePath,
          JSON.stringify(result, null, 2),
          'utf-8'
        );

        console.log('Debug file saved:', filePath);
      } catch (saveError: any) {
        console.error('Failed to save debug file:', saveError.message);
        // Don't fail the request if debug save fails
      }

      res.json({
        success: true,
        data: result,
      } as ConvertResponseDto);
    } catch (error: any) {
      console.error('Convert error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      } as ConvertResponseDto);
    }
  };

  /**
   * Multer middleware for file upload
   */
  uploadMiddleware = upload.single('file');
}
