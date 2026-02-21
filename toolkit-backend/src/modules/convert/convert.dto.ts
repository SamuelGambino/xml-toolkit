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
  MODIFIER_GROUP_ID = 'ModifierGroupId',
  MODIFIER_GROUP_NAME = 'ModifierGroupName',
  MODIFIER_GROUP_TYPE = 'ModifierGroupType',
  MODIFIER_GROUP_MAX_SELECT = 'ModifierGroupMaxSelect',
  MODIFIER_GROUP_MIN_SELECT = 'ModifierGroupMinSelect',
  MODIFIER_ID = 'ModifierId',
  MODIFIER_NAME = 'ModifierName',
  MODIFIER_PRICE = 'ModifierPrice',
  CATEGORY_PARENT = 'CategoryParent',
  PRODUCT_PARAMETER_ID = 'ProductParameterId',
  PRODUCT_PARAMETER_WEIGHT = 'ProductParameterWeight',
  PRODUCT_PARAMETER_WEIGHT_UNIT = 'ProductParameterWeightUnit',
  PRODUCT_PARAMETER_PRICE = 'ProductParameterPrice',
  PRODUCT_PARAMETER_OLD_PRICE = 'ProductParameterOldPrice',
  PRODUCT_PARAMETER_PRICE_UNIT = 'ProductParameterPriceUnit',
  PRODUCT_PARAMETER_PROTEINS = 'ProductParameterProteins',
  PRODUCT_PARAMETER_FATS = 'ProductParameterFats',
  PRODUCT_PARAMETER_CARBOHYDRATES = 'ProductParameterCarbohydrates',
  PRODUCT_PARAMETER_CALORIES = 'ProductParameterCalories',
  PRODUCT_PARAMETER_ENERGY_VALUE = 'ProductParameterEnergyValue',
}

/**
 * Column mapping configuration
 */
export interface ColumnMapping {
  columnIndex: number;
  columnName: string;
  columnType: ColumnType;
}

/**
 * Request DTO for convert endpoint
 */
export interface ConvertRequestDto {
  mappings: ColumnMapping[];
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
