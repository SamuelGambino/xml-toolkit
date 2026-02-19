/**
 * Data Transfer Objects for convert module
 */

import { UniversalProductData } from './domain/models';

/**
 * Supported column types for mapping
 */
export enum ColumnType {
  CATEGORY = 'Category',
  PRODUCT = 'Product',
  MODIFIER_GROUP = 'ModifierGroup',
  MODIFIER = 'Modifier',
  PRODUCT_NAME = 'ProductName',
  PRODUCT_DESCRIPTION = 'ProductDescription',
  PRODUCT_IMAGE = 'ProductImage',
  MODIFIER_NAME = 'ModifierName',
  MODIFIER_PRICE = 'ModifierPrice',
  MODIFIER_GROUP_NAME = 'ModifierGroupName',
  MODIFIER_GROUP_TYPE = 'ModifierGroupType',
  MODIFIER_GROUP_MAX_SELECT = 'ModifierGroupMaxSelect',
  MODIFIER_GROUP_MIN_SELECT = 'ModifierGroupMinSelect',
  CATEGORY_PARENT = 'CategoryParent',
  PRODUCT_PARAMETER_ID = 'ProductParameterId',
  PRODUCT_PARAMETER_WEIGHT = 'ProductParameterWeight',
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
}

/**
 * Response DTO for convert endpoint
 */
export interface ConvertResponseDto {
  success: boolean;
  data?: UniversalProductData;
  error?: string;
}
