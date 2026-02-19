export interface ConvertConfig {
  direction: "xml-to-csv" | "csv-to-xml"
  mappings: {
    source: SourceField
    target: string
  }[]
  options?: {
    delimiter?: string
    rootNode?: string
  }
}

export type SourceField =
  | "categoryName"
  | "categoryArticle"
  | "subcategoryName"
  | "offerName"
  | "offerArticle"
  | "offerPrice"
  | "offerWeight"
  | "offerUnit"
  | "offerImg"
  | "offerDescription"
  | "priceArticle"
  | "modifierGroupName"
  | "modifierGroupType"
  | "modifierGroupMin"
  | "modifierGroupMax"
  | "modifierGroupArticle"
  | "modifierName"
  | "modifierArticle"
  | "modifierPrice"

export interface NormalizedDocument {
  categories: Category[]
  modifiersGroups: ModifiersGroup[]
}

export interface Category {
  id: string
  name: string
  article: string
  parentId: string | null
  offers: Offer[]
}

export interface Offer {
  id: string
  name: string
  article: string
  description: string
  image: string
  weight: number
  unit: string
  priceParameters: PriceParameter[]
}

export interface PriceParameter {
  id: string
  article: string
  price: number
}

export interface ModifiersGroup {
  id: string
  name: string
  article: string
  type: string
  min: number
  max: number
  modifiers: Modifier[]
}

export interface Modifier {
  id: string
  name: string
  article: string
  price: number
}
