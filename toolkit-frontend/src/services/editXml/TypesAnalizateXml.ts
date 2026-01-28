namespace TypesAnalizateXml {
  export interface IModifier {
    id: number;
    name: string;
    price: number;
    required: boolean;
    searchReq: string | null;
  };

  export interface IModifiersGroup {
    id: number;
    name: string;
    type: string;
    minimum: number;
    maximum: number;
    modifiers: IModifier[];
    searchReq: string | null;
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
    searchReq: string | null;
  }

  export interface ICategories {
    id: number;
    name: string;
    products: IProduct[];
    searchReq: string | null;
  }

  export interface INormalizeXml {
    modifiersGroups: IModifiersGroup[];
    categories: ICategories[];
  }

  export interface IDefaultMD {
    quantity: number;
    names?: {
      name: string;
      searchReq: string | null;
    }[];
    name?: string;
    searchReq?: string | null;
  }

  export interface IDefaultCheckMD {
    true: number;
    false: number;
    searchReq?: {
      true: string;
      false: string;
    }
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
      offers: {
        name: string,
        searchReq: string | null
      }[];
    }[]
  }

  export interface IPictureCheckMD extends IDefaultCheckMD {
    trueData: {
      url: string;
      name: string;
      searchReq: string;
    }[],
    falseData: {
      url: string;
      name: string
      searchReq: string;
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