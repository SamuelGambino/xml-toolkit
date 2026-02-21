/**
 * Table mapper service - maps table rows to domain objects based on column mappings
 */

import {
  Category,
  Modifier,
  ModifierGroup,
  Product,
  ProductParameter,
  UniversalProductData,
} from '../domain/models';
import { ColumnMapping, ColumnType } from '../convert.dto';
import { generateId } from '../domain/idGenerator';

interface TableRow {
  [columnIndex: number]: string | number;
}

interface ParsingState {
  currentCategory: { id: string; name: string } | null;
  currentProduct: { id: string; name: string } | null;
  currentModifierGroup: { id: string; name: string } | null;
}

interface RowTypeData {
  category?: { id?: string; name: string; parentId?: string };
  product?: { id?: string; name: string; description?: string; image?: string };
  parameter?: ProductParameter;
  modifierGroup?: {
    id?: string;
    name: string;
    type?: string;
    maxSelect?: number;
    minSelect?: number;
  };
  modifier?: { id?: string; name: string; price: number };
}

export class TableMapper {
  static mapToUniversalFormat(rows: TableRow[], mappings: ColumnMapping[]): UniversalProductData {
    const result: UniversalProductData = {
      categories: [],
      modifierGroups: [],
    };

    const state: ParsingState = {
      currentCategory: null,
      currentProduct: null,
      currentModifierGroup: null,
    };

    rows.slice(1).forEach((row) => {
      const rowData = this.collectRowTypeData(row, mappings);

      if (rowData.category) {
        this.handleCategory(rowData.category, result, state);
      }

      if (rowData.product) {
        this.handleProduct(rowData.product, result, state);
      }

      if (rowData.parameter) {
        this.handleProductParameter(rowData.parameter, result, state);
      }

      if (rowData.modifierGroup) {
        this.handleModifierGroup(rowData.modifierGroup, result, state);
      }

      if (rowData.modifier) {
        this.handleModifier(rowData.modifier, result, state);
      }
    });

    return result;
  }

  private static collectRowTypeData(row: TableRow, mappings: ColumnMapping[]): RowTypeData {
    const categoryName = this.getValueByType(row, mappings, ColumnType.CATEGORY_NAME);
    const categoryId = this.getValueByType(row, mappings, ColumnType.CATEGORY_ID);
    const categoryParent = this.getValueByType(row, mappings, ColumnType.CATEGORY_PARENT);

    const productName = this.getValueByType(row, mappings, ColumnType.PRODUCT_NAME);
    const productId = this.getValueByType(row, mappings, ColumnType.PRODUCT_ID);

    const modifierGroupName = this.getValueByType(row, mappings, ColumnType.MODIFIER_GROUP_NAME);
    const modifierGroupId = this.getValueByType(row, mappings, ColumnType.MODIFIER_GROUP_ID);

    const modifierName = this.getValueByType(row, mappings, ColumnType.MODIFIER_NAME);
    const modifierId = this.getValueByType(row, mappings, ColumnType.MODIFIER_ID);

    const parameter = this.collectParameter(row, mappings);

    const rowData: RowTypeData = {};

    if (categoryName) {
      rowData.category = {
        id: categoryId,
        name: categoryName,
        parentId: categoryParent,
      };
    }

    if (productName) {
      rowData.product = {
        id: productId,
        name: productName,
        description: this.getValueByType(row, mappings, ColumnType.PRODUCT_DESCRIPTION),
        image: this.getValueByType(row, mappings, ColumnType.PRODUCT_IMAGE),
      };
    }

    if (parameter) {
      rowData.parameter = parameter;
    }

    if (modifierGroupName) {
      rowData.modifierGroup = {
        id: modifierGroupId,
        name: modifierGroupName,
        type: this.getValueByType(row, mappings, ColumnType.MODIFIER_GROUP_TYPE),
        maxSelect: this.parseIntOrUndefined(
          this.getValueByType(row, mappings, ColumnType.MODIFIER_GROUP_MAX_SELECT)
        ),
        minSelect: this.parseIntOrUndefined(
          this.getValueByType(row, mappings, ColumnType.MODIFIER_GROUP_MIN_SELECT)
        ),
      };
    }

    if (modifierName) {
      rowData.modifier = {
        id: modifierId,
        name: modifierName,
        price:
          this.parseNumber(this.getValueByType(row, mappings, ColumnType.MODIFIER_PRICE)) ?? 0,
      };
    }

    return rowData;
  }

  private static handleCategory(
    data: { id?: string; name: string; parentId?: string },
    result: UniversalProductData,
    state: ParsingState
  ): void {
    if (state.currentCategory && state.currentCategory.name === data.name) {
      return;
    }

    const existing = result.categories.find((category) => category.name === data.name);

    if (existing) {
      state.currentCategory = { id: existing.id, name: existing.name };
      state.currentProduct = null;
      state.currentModifierGroup = null;
      return;
    }

    const category: Category = {
      id: data.id || generateId('cat'),
      name: data.name,
      parentId: data.parentId,
      products: [],
    };

    result.categories.push(category);
    state.currentCategory = { id: category.id, name: category.name };
    state.currentProduct = null;
    state.currentModifierGroup = null;
  }

  private static handleProduct(
    data: { id?: string; name: string; description?: string; image?: string },
    result: UniversalProductData,
    state: ParsingState
  ): void {
    if (!state.currentCategory) {
      return;
    }

    if (state.currentProduct && state.currentProduct.name === data.name) {
      return;
    }

    const category = result.categories.find((item) => item.id === state.currentCategory?.id);
    if (!category) {
      return;
    }

    const existing = category.products.find((item) => item.name === data.name);

    if (existing) {
      state.currentProduct = { id: existing.id, name: existing.name };
      state.currentModifierGroup = null;
      return;
    }

    const product: Product = {
      id: data.id || generateId('prod'),
      name: data.name,
      description: data.description,
      image: data.image,
      modifers: [],
      parameters: [],
    };

    category.products.push(product);
    state.currentProduct = { id: product.id, name: product.name };
    state.currentModifierGroup = null;
  }

  private static handleProductParameter(
    parameter: ProductParameter,
    result: UniversalProductData,
    state: ParsingState
  ): void {
    if (!state.currentProduct) {
      return;
    }

    const product = this.findProductById(result, state.currentProduct.id);
    if (!product) {
      return;
    }

    product.parameters.push(parameter);
  }

  private static handleModifierGroup(
    data: { id?: string; name: string; type?: string; maxSelect?: number; minSelect?: number },
    result: UniversalProductData,
    state: ParsingState
  ): void {
    if (!state.currentProduct) {
      return;
    }

    if (state.currentModifierGroup && state.currentModifierGroup.name === data.name) {
      return;
    }

    const existing = result.modifierGroups.find((item) => item.name === data.name);

    const group: ModifierGroup = existing || {
      id: data.id || generateId('mg'),
      name: data.name,
      type: data.type,
      maxSelect: data.maxSelect,
      minSelect: data.minSelect,
      modifiers: [],
    };

    if (!existing) {
      result.modifierGroups.push(group);
    }

    const product = this.findProductById(result, state.currentProduct.id);
    if (product && !product.modifers.includes(group.id)) {
      product.modifers.push(group.id);
    }

    state.currentModifierGroup = { id: group.id, name: group.name };
  }

  private static handleModifier(
    data: { id?: string; name: string; price: number },
    result: UniversalProductData,
    state: ParsingState
  ): void {
    if (!state.currentModifierGroup) {
      return;
    }

    const group = result.modifierGroups.find((item) => item.id === state.currentModifierGroup?.id);
    if (!group) {
      return;
    }

    const existing = group.modifiers.find((item) => item.name === data.name);
    if (existing) {
      return;
    }

    const modifier: Modifier = {
      id: data.id || generateId('mod'),
      name: data.name,
      price: data.price,
    };

    group.modifiers.push(modifier);
  }

  private static collectParameter(
    row: TableRow,
    mappings: ColumnMapping[]
  ): ProductParameter | undefined {
    const id = this.getValueByType(row, mappings, ColumnType.PRODUCT_PARAMETER_ID);
    const weight = this.parseNumber(
      this.getValueByType(row, mappings, ColumnType.PRODUCT_PARAMETER_WEIGHT)
    );
    const price = this.parseNumber(
      this.getValueByType(row, mappings, ColumnType.PRODUCT_PARAMETER_PRICE)
    );

    if (!id || weight === null || price === null) {
      return undefined;
    }

    return {
      id,
      weight,
      weightUnit: this.getValueByType(row, mappings, ColumnType.PRODUCT_PARAMETER_WEIGHT_UNIT),
      price,
      oldPrice: this.parseNumber(
        this.getValueByType(row, mappings, ColumnType.PRODUCT_PARAMETER_OLD_PRICE)
      ) ?? undefined,
      priceUnit: this.getValueByType(row, mappings, ColumnType.PRODUCT_PARAMETER_PRICE_UNIT),
      proteins:
        this.parseNumber(this.getValueByType(row, mappings, ColumnType.PRODUCT_PARAMETER_PROTEINS)) ??
        undefined,
      fats:
        this.parseNumber(this.getValueByType(row, mappings, ColumnType.PRODUCT_PARAMETER_FATS)) ??
        undefined,
      carbohydrates:
        this.parseNumber(
          this.getValueByType(row, mappings, ColumnType.PRODUCT_PARAMETER_CARBOHYDRATES)
        ) ?? undefined,
      calories:
        this.parseNumber(this.getValueByType(row, mappings, ColumnType.PRODUCT_PARAMETER_CALORIES)) ??
        undefined,
      energyValue:
        this.parseNumber(
          this.getValueByType(row, mappings, ColumnType.PRODUCT_PARAMETER_ENERGY_VALUE)
        ) ?? undefined,
    };
  }

  private static getValueByType(
    row: TableRow,
    mappings: ColumnMapping[],
    type: ColumnType
  ): string | undefined {
    const mapping = mappings.find((item) => item.columnType === type);
    if (!mapping) {
      return undefined;
    }

    const value = row[mapping.columnIndex];
    if (value === null || value === undefined) {
      return undefined;
    }

    const normalized = String(value).trim();
    return normalized || undefined;
  }

  private static parseNumber(value: string | undefined): number | null {
    if (!value) {
      return null;
    }

    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }

  private static parseIntOrUndefined(value: string | undefined): number | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  private static findProductById(data: UniversalProductData, productId: string): Product | undefined {
    for (const category of data.categories) {
      const product = category.products.find((item) => item.id === productId);
      if (product) {
        return product;
      }
    }

    return undefined;
  }
}
