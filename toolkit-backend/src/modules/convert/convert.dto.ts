/**
 * Data Transfer Objects for convert module
 */

import { UniversalProductData } from './domain/models';

/**
 * Supported column types for mapping
 */
export enum ColumnType {
  CATEGORY_ID = 'CategoryId',
  CATEGORY_NAME = 'CategoryName',
  PRODUCT = 'Product',
  PRODUCT_ID = 'ProductId',
  PRODUCT_NAME = 'ProductName',
  PRODUCT_DESCRIPTION = 'ProductDescription',
  PRODUCT_IMAGE = 'ProductImage',
  PRODUCT_LINK = 'ProductLink',
  MODIFIER_GROUP_ID = 'ModifierGroupId',
  MODIFIER_GROUP_NAME = 'ModifierGroupName',
  MODIFIER_GROUP_TYPE = 'ModifierGroupType',
  MODIFIER_GROUP_MAX_SELECT = 'ModifierGroupMaxSelect',
  MODIFIER_GROUP_MIN_SELECT = 'ModifierGroupMinSelect',
  MODIFIER_ID = 'ModifierId',
  MODIFIER_NAME = 'ModifierName',
  MODIFIER_PRICE = 'ModifierPrice',
  SUBCATEGORY_NAME = 'SubcategoryName',
  SUBCATEGORY_ID = 'SubcategoryId',
  PRODUCT_PARAMETER_ID = 'ProductParameterId',
  PRODUCT_PARAMETER_CHARACTERISTIC = 'ProductParameterCharacteristic',
  PRODUCT_PARAMETER_CHARACTERISTIC_UNIT = 'ProductParameterCharacteristicUnit',
  PRODUCT_PARAMETER_PRICE = 'ProductParameterPrice',
}

/**
 * Column mapping configuration
 */
export interface ColumnMapping {
  columnIndex: number;
  columnName: string;
  columnType: ColumnType;
}

export interface CharacteristicColumnMapping {
  columnIndex: number;
  columnName: string;
  unitIndex?: number;
}

export interface ColumnMappingConfig {
  columns: ColumnMapping[];
  characteristic?: CharacteristicColumnMapping[];
}

/**
 * Request DTO for convert endpoint
 */
export interface ConvertRequestDto {
  mappings: ColumnMappingConfig;
}

/**
 * Response DTO for config endpoint
 */
export interface ConfigResponseDto {
  supportedColumnTypes: {
    value: string;
    label: string;
    labelRu?: string;
    description?: string;
    filter?: string[];
    domains: string[];
    priority: {
      universal: "secondary" | "primary" | "hidden";
      food: "secondary" | "primary" | "hidden";
      retail: "secondary" | "primary" | "hidden";
    };
  }[];
  /** Output formats for "Convert to" (e.g. table, xml). Frontend excludes current format. */
  supportedOutputFormats: {
    value: string;
    label: string;
  }[];
}

/**
 * Response DTO for convert endpoint
 */
export interface ConvertResponseDto {
  success: boolean;
  data?: UniversalProductData;
  error?: string;
}
