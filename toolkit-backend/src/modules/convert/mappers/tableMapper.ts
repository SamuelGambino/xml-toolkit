/**
 * Table mapper service - maps table rows to domain objects based on column mappings
 */

import {
  Modifier,
  ModifierGroup,
  Category,
  Product,
  ProductParameter,
  UniversalProductData,
} from '../domain/models';
import { ColumnMapping, ColumnType } from '../convert.dto';
import { generateId } from '../domain/idGenerator';

interface TableRow {
  [columnIndex: number]: string | number;
}

export class TableMapper {
  /**
   * Maps table rows to universal product data format
   */
  static mapToUniversalFormat(
    rows: TableRow[],
    mappings: ColumnMapping[]
  ): UniversalProductData {
    const modifierGroupsMap = new Map<string, ModifierGroup>();
    const categoriesMap = new Map<string, Category>();
    const categoryNameToIdMap = new Map<string, string>();
    const modifierGroupNameToIdMap = new Map<string, string>();

    // Process each row
    for (const row of rows) {
      // Extract values based on mappings
      const categoryName = this.getValueByType(row, mappings, ColumnType.CATEGORY);
      const productName = this.getValueByType(row, mappings, ColumnType.PRODUCT_NAME);
      const modifierGroupName = this.getValueByType(
        row,
        mappings,
        ColumnType.MODIFIER_GROUP_NAME
      );
      const modifierName = this.getValueByType(row, mappings, ColumnType.MODIFIER_NAME);

      // Process category (with empty products array)
      if (categoryName) {
        this.getOrCreateCategory(
          categoryName,
          categoriesMap,
          categoryNameToIdMap,
          row,
          mappings
        );
      }

      // Process modifier group
      if (modifierGroupName) {
        const modifierGroupId = this.getOrCreateModifierGroup(
          modifierGroupName,
          modifierGroupsMap,
          modifierGroupNameToIdMap,
          row,
          mappings
        );

        // Process modifier if present
        if (modifierName) {
          this.addModifierToGroup(
            modifierGroupId,
            modifierGroupsMap,
            row,
            mappings
          );
        }
      }

      // Process product and add to category
      if (productName) {
        const product = this.createProduct(row, mappings, modifierGroupNameToIdMap);
        if (product) {
          const targetCategoryName = categoryName || 'Без категории';
          const categoryId = this.getOrCreateCategory(
            targetCategoryName,
            categoriesMap,
            categoryNameToIdMap,
            row,
            mappings
          );
          const category = categoriesMap.get(categoryId);
          if (category) {
            category.products.push(product);
          }
        }
      }
    }

    return {
      modifierGroups: Array.from(modifierGroupsMap.values()),
      categories: Array.from(categoriesMap.values()),
    };
  }

  private static getValueByType(
    row: TableRow,
    mappings: ColumnMapping[],
    type: ColumnType
  ): string | undefined {
    const mapping = mappings.find((m) => m.columnType === type);
    if (!mapping) return undefined;
    const value = row[mapping.columnIndex];
    return value !== undefined && value !== null ? String(value).trim() : undefined;
  }

  private static getOrCreateCategory(
    categoryName: string,
    categoriesMap: Map<string, Category>,
    categoryNameToIdMap: Map<string, string>,
    row: TableRow,
    mappings: ColumnMapping[]
  ): string {
    if (categoryNameToIdMap.has(categoryName)) {
      return categoryNameToIdMap.get(categoryName)!;
    }

    const categoryId = generateId('cat');
    const parentCategoryName = this.getValueByType(row, mappings, ColumnType.CATEGORY_PARENT);
    let parentId: string | undefined;

    if (parentCategoryName && categoryNameToIdMap.has(parentCategoryName)) {
      parentId = categoryNameToIdMap.get(parentCategoryName);
    }

    const category: Category = {
      id: categoryId,
      name: categoryName,
      parentId,
      products: [],
    };

    categoriesMap.set(categoryId, category);
    categoryNameToIdMap.set(categoryName, categoryId);
    return categoryId;
  }

  private static getOrCreateModifierGroup(
    modifierGroupName: string,
    modifierGroupsMap: Map<string, ModifierGroup>,
    modifierGroupNameToIdMap: Map<string, string>,
    row: TableRow,
    mappings: ColumnMapping[]
  ): string {
    if (modifierGroupNameToIdMap.has(modifierGroupName)) {
      return modifierGroupNameToIdMap.get(modifierGroupName)!;
    }

    const modifierGroupId = generateId('mg');
    const type = this.getValueByType(row, mappings, ColumnType.MODIFIER_GROUP_TYPE);
    const maxSelectStr = this.getValueByType(
      row,
      mappings,
      ColumnType.MODIFIER_GROUP_MAX_SELECT
    );
    const minSelectStr = this.getValueByType(
      row,
      mappings,
      ColumnType.MODIFIER_GROUP_MIN_SELECT
    );

    const modifierGroup: ModifierGroup = {
      id: modifierGroupId,
      name: modifierGroupName,
      type: type || undefined,
      maxSelect: maxSelectStr ? parseInt(maxSelectStr, 10) : undefined,
      minSelect: minSelectStr ? parseInt(minSelectStr, 10) : undefined,
      modifiers: [],
    };

    modifierGroupsMap.set(modifierGroupId, modifierGroup);
    modifierGroupNameToIdMap.set(modifierGroupName, modifierGroupId);
    return modifierGroupId;
  }

  private static addModifierToGroup(
    modifierGroupId: string,
    modifierGroupsMap: Map<string, ModifierGroup>,
    row: TableRow,
    mappings: ColumnMapping[]
  ): void {
    const modifierGroup = modifierGroupsMap.get(modifierGroupId);
    if (!modifierGroup) return;

    const modifierName = this.getValueByType(row, mappings, ColumnType.MODIFIER_NAME);
    const priceStr = this.getValueByType(row, mappings, ColumnType.MODIFIER_PRICE);

    if (!modifierName) return;

    // Check if modifier already exists
    const existingModifier = modifierGroup.modifiers.find((m) => m.name === modifierName);
    if (existingModifier) return;

    const modifier: Modifier = {
      id: generateId('mod'),
      name: modifierName,
      price: priceStr ? parseFloat(priceStr) : 0,
    };

    modifierGroup.modifiers.push(modifier);
  }

  private static createProduct(
    row: TableRow,
    mappings: ColumnMapping[],
    modifierGroupNameToIdMap: Map<string, string>
  ): Product | null {
    const productName = this.getValueByType(row, mappings, ColumnType.PRODUCT_NAME);
    if (!productName) return null;

    const description = this.getValueByType(row, mappings, ColumnType.PRODUCT_DESCRIPTION);
    const image = this.getValueByType(row, mappings, ColumnType.PRODUCT_IMAGE);

    // Get modifier group IDs
    const modifierGroupName = this.getValueByType(
      row,
      mappings,
      ColumnType.MODIFIER_GROUP_NAME
    );
    const modifers: string[] = [];
    if (modifierGroupName && modifierGroupNameToIdMap.has(modifierGroupName)) {
      modifers.push(modifierGroupNameToIdMap.get(modifierGroupName)!);
    }

    // Get product parameters
    const parameters: ProductParameter[] = [];
    const paramId = this.getValueByType(row, mappings, ColumnType.PRODUCT_PARAMETER_ID);
    const paramWeight = this.getValueByType(row, mappings, ColumnType.PRODUCT_PARAMETER_WEIGHT);
    const paramPrice = this.getValueByType(row, mappings, ColumnType.PRODUCT_PARAMETER_PRICE);

    if (paramId && paramWeight && paramPrice) {
      parameters.push({
        id: paramId,
        weight: parseFloat(String(paramWeight)),
        price: parseFloat(String(paramPrice)),
      });
    }

    return {
      id: generateId('prod'),
      name: productName,
      description: description || undefined,
      image: image || undefined,
      modifers,
      parameters,
    };
  }
}
