import {
  Category,
  Modifier,
  ModifierGroup,
  Product,
  ProductParameter,
  UniversalProductData,
} from '../domain/models';
import { generateId } from '../domain/idGenerator';

export interface CategoryData {
  id?: string;
  name?: string | null;
  parentId?: string | null;
}

export interface ProductData {
  id?: string;
  name?: string | null;
  description?: string | null;
  image?: string | null;
}

export interface ParameterData {
  id?: string | number | null;
  weight?: string | number | null;
  price?: string | number | null;
}

export interface ModifierGroupData {
  id?: string;
  name?: string | null;
  type?: string | null;
  maxSelect?: string | number | null;
  minSelect?: string | number | null;
}

export interface ModifierData {
  id?: string;
  name?: string | null;
  price?: string | number | null;
}

interface ParserStateSnapshot {
  currentCategory: Category | null;
  currentProduct: Product | null;
  currentModGroup: ModifierGroup | null;
}

/**
 * Manages hierarchical parsing state while processing flat rows of data.
 *
 * Hierarchy:
 *   Category -> Product -> Parameters -> Modifiers
 *
 * The manager keeps track of the "current" entities so that subsequent calls
 * (e.g. parameters or modifiers) are always attached to the right parent.
 *
 * Priority rule:
 *   When processing a record/line that may contain several entity types,
 *   always call processCategory() first, then processProduct(), then
 *   processParameter()/processModGroup(), and finally processModifier().
 */
export class ParserStateManager {
  private readonly categories = new Map<string, Category>();
  private readonly modifierGroups = new Map<string, ModifierGroup>();
  private readonly categoryNameToId = new Map<string, string>();
  private readonly modifierGroupNameToId = new Map<string, string>();

  private currentCategory: Category | null = null;
  private currentProduct: Product | null = null;
  private currentModGroup: ModifierGroup | null = null;

  /**
   * Process category data and update state.
   *
   * - Creates a new category if it does not exist.
   * - Supports parentId for subcategories.
   * - Resets current product and modifier group.
   */
  processCategory(data: CategoryData): Category | null {
    const name = this.normalizeText(data.name);
    if (!name && !data.id) {
      return this.currentCategory;
    }

    let id = data.id;

    if (!id && name) {
      id = this.categoryNameToId.get(name) ?? undefined;
    }

    if (!id) {
      id = generateId('cat');
      const category: Category = {
        id,
        name: name ?? '',
        parentId: data.parentId ?? undefined,
        products: [],
      };

      this.categories.set(id, category);
      if (name) {
        this.categoryNameToId.set(name, id);
      }
    } else if (!this.categories.has(id)) {
      const category: Category = {
        id,
        name: name ?? '',
        parentId: data.parentId ?? undefined,
        products: [],
      };
      this.categories.set(id, category);
      if (name) {
        this.categoryNameToId.set(name, id);
      }
    } else {
      const existing = this.categories.get(id)!;
      if (name) {
        existing.name = name;
        this.categoryNameToId.set(name, id);
      }
      if (data.parentId !== undefined && data.parentId !== null) {
        existing.parentId = data.parentId || undefined;
      }
    }

    this.currentCategory = this.categories.get(id)!;
    this.currentProduct = null;
    this.currentModGroup = null;

    return this.currentCategory;
  }

  /**
   * Process product data and bind it to the current category.
   *
   * - If there is no current category, creates a default "Без категории" one.
   * - Updates currentProduct state and resets currentModGroup.
   */
  processProduct(data: ProductData): Product | null {
    const name = this.normalizeText(data.name);
    if (!name) {
      return this.currentProduct;
    }

    if (!this.currentCategory) {
      this.processCategory({ name: 'Без категории' });
    }

    if (!this.currentCategory) {
      return null;
    }

    const description = this.normalizeText(data.description);
    const image = this.normalizeText(data.image);

    const product: Product = {
      id: data.id ?? generateId('prod'),
      name,
      description: description || undefined,
      image: image || undefined,
      modifers: [],
      parameters: [],
    };

    this.currentCategory.products.push(product);
    this.currentProduct = product;
    this.currentModGroup = null;

    return product;
  }

  /**
   * Process parameter data and attach it to the current product.
   */
  processParameter(data: ParameterData): ProductParameter | null {
    if (!this.currentProduct) {
      return null;
    }

    const id = this.normalizeText(
      data.id !== undefined && data.id !== null ? String(data.id) : null
    );
    if (!id) {
      return null;
    }

    const weight = this.parseNumber(data.weight);
    const price = this.parseNumber(data.price);

    if (weight === null || price === null) {
      return null;
    }

    const parameter: ProductParameter = {
      id,
      weight,
      price,
    };

    this.currentProduct.parameters.push(parameter);
    return parameter;
  }

  /**
   * Process modifier group data, attach it to the product and update state.
   *
   * - Reuses existing groups by name.
   * - Writes the group ID to the current product.modifers array.
   */
  processModGroup(data: ModifierGroupData): ModifierGroup | null {
    if (!this.currentProduct) {
      return null;
    }

    const name = this.normalizeText(data.name);
    if (!name && !data.id) {
      return this.currentModGroup;
    }

    let id = data.id;

    if (!id && name) {
      id = this.modifierGroupNameToId.get(name) ?? undefined;
    }

    if (!id) {
      id = generateId('mg');
      const maxSelect = this.parseIntOrUndefined(data.maxSelect);
      const minSelect = this.parseIntOrUndefined(data.minSelect);

      const group: ModifierGroup = {
        id,
        name: name ?? '',
        maxSelect,
        minSelect,
        modifiers: [],
      };

      this.modifierGroups.set(id, group);
      if (name) {
        this.modifierGroupNameToId.set(name, id);
      }
    } else if (!this.modifierGroups.has(id)) {
      const maxSelect = this.parseIntOrUndefined(data.maxSelect);
      const minSelect = this.parseIntOrUndefined(data.minSelect);

      const group: ModifierGroup = {
        id,
        name: name ?? '',
        maxSelect,
        minSelect,
        modifiers: [],
      };
      this.modifierGroups.set(id, group);
      if (name) {
        this.modifierGroupNameToId.set(name, id);
      }
    } else {
      const existing = this.modifierGroups.get(id)!;
      if (name) {
        existing.name = name;
        this.modifierGroupNameToId.set(name, id);
      }
      const maxSelect = this.parseIntOrUndefined(data.maxSelect);
      const minSelect = this.parseIntOrUndefined(data.minSelect);
      if (maxSelect !== undefined) {
        existing.maxSelect = maxSelect;
      }
      if (minSelect !== undefined) {
        existing.minSelect = minSelect;
      }
    }

    const group = this.modifierGroups.get(id)!;

    if (!this.currentProduct.modifers.includes(group.id)) {
      this.currentProduct.modifers.push(group.id);
    }

    this.currentModGroup = group;
    return group;
  }

  /**
   * Process modifier data and attach it to the current modifier group.
   */
  processModifier(data: ModifierData): Modifier | null {
    if (!this.currentModGroup) {
      return null;
    }

    const name = this.normalizeText(data.name);
    if (!name) {
      return null;
    }

    const price = this.parseNumber(data.price) ?? 0;

    const existing = this.currentModGroup.modifiers.find((m) => m.name === name);
    if (existing) {
      existing.price = price;
      return existing;
    }

    const modifier: Modifier = {
      id: data.id ?? generateId('mod'),
      name,
      price,
    };

    this.currentModGroup.modifiers.push(modifier);
    return modifier;
  }

  /**
   * Returns the current state snapshot.
   */
  getState(): ParserStateSnapshot {
    return {
      currentCategory: this.currentCategory,
      currentProduct: this.currentProduct,
      currentModGroup: this.currentModGroup,
    };
  }

  /**
   * Finalizes and returns the aggregated universal product data.
   */
  toResult(): UniversalProductData {
    return {
      modifierGroups: Array.from(this.modifierGroups.values()),
      categories: Array.from(this.categories.values()),
    };
  }

  /**
   * Normalizes text values and applies basic CSV encoding fixes
   * (Windows‑1251 vs UTF‑8 mojibake heuristics).
   */
  private normalizeText(value: string | null | undefined): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    let text = String(value).trim();
    if (!text) {
      return null;
    }

    // Strip BOM if present
    if (text.charCodeAt(0) === 0xfeff) {
      text = text.slice(1);
    }

    // If the text already contains Cyrillic characters, assume it's correct.
    if (/[А-Яа-яЁё]/.test(text)) {
      return text;
    }

    // Heuristic: if the string looks like mojibake (common for cp1251 vs UTF‑8),
    // try to repair it by re-decoding from binary to UTF‑8.
    if (/[ÃÂÐÑ]/.test(text)) {
      try {
        const buf = Buffer.from(text, 'binary');
        const repaired = buf.toString('utf8');
        if (/[А-Яа-яЁё]/.test(repaired) || !/[ÃÂÐÑ]/.test(repaired)) {
          return repaired.trim();
        }
      } catch {
        // Fallback to original text if repair fails
        return text;
      }
    }

    return text;
  }

  private parseNumber(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const normalized =
      typeof value === 'number'
        ? value
        : Number(String(value).replace(',', '.').trim());

    return Number.isFinite(normalized) ? normalized : null;
  }

  private parseIntOrUndefined(
    value: string | number | null | undefined
  ): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    const intVal = parseInt(String(value).trim(), 10);
    return Number.isNaN(intVal) ? undefined : intVal;
  }
}

