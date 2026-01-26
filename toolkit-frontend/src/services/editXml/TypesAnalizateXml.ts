namespace TypesAnalizateXml {
  export interface IModifier {
    id: number;
    name: string;
    price: number;
    required: boolean;
    range: XmlRange | null;
  };

  export interface IModifiersGroup {
    id: number;
    name: string;
    type: string;
    minimum: number;
    maximum: number;
    modifiers: IModifier[];
    range: XmlRange | null;
  };

  export interface IParameter {
    id: number;
    price: number | null;
    description: string | null;
    descriptionIndex: number | null;
  }

  export interface IProduct {
    id: number;
    available: boolean;
    name: string;
    description: string;
    picture: string;
    parameters: IParameter[];
    categoryId: string | number;
    range: XmlRange | null;
  }

  export interface ICategories {
    id: number;
    name: string;
    products: IProduct[];
    range: XmlRange | null;
  }

  export interface XmlRange {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  }

  export interface INormalizeXml {
    modifiersGroups: IModifiersGroup[];
    categories: ICategories[];
  }

  export interface IDefaultMD {
    quantity: number;
    names?: {
      name: string;
      range: XmlRange | null;
    }[];
    name?: string;
  }

  export interface IDefaultCheckMD {
    true: number;
    false: number;
  }

  export interface IModGroupsMD extends IDefaultMD {
    types: IDefaultMD[]
  }

  export interface IParameterMD {
    quantity: number;
    price: IDefaultCheckMD;
    description: IDefaultCheckMD;
    descriptionIndex: IDefaultCheckMD;
    data: {
      quantityParams: number;
      offersWhoHas: number;
      offers: string[];
    }[]
  }

  export interface IPictureCheckMD extends IDefaultCheckMD {
    trueData: {
      url: string;
      name: string
    }[],
    falseData: {
      url: string;
      name: string
    }[]
  }

  export interface IOffersMD extends IDefaultMD {
    description: IDefaultCheckMD;
    picture: IPictureCheckMD;
    parameters: IParameterMD;
    categoryId: IDefaultCheckMD;
  }

  export interface IMetaData {
    modifiersGroups: IModGroupsMD;
    modifiers: IDefaultMD;
    categories: IDefaultMD;
    offers: IOffersMD;
  }
}

export default TypesAnalizateXml;