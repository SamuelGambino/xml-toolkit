/**
 * Domain models for the universal product format
 */

export interface Modifier {
  id: string;
  name: string;
  price: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  type?: string;
  maxSelect?: number;
  minSelect?: number;
  modifiers: Modifier[];
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  products: Product[];
}

export interface ProductParameter {
  id: string;
  weight: number;
  weightUnit?: string;
  proteins?: number;
  fats?: number;
  carbohydrates?: number;
  calories?: number;
  energyValue?: number;
  price: number;
  oldPrice?: number;
  priceUnit?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  image?: string; // URL
  link?: string; // URL
  modifers: string[]; // Array of modifier group IDs
  parameters: ProductParameter[];
}

export interface UniversalProductData {
  modifierGroups: ModifierGroup[];
  categories: Category[];
}
