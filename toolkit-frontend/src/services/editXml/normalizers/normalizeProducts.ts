import TypesAnalizateXml from "../TypesAnalizateXml";

export const normalizeProducts = (xml: any, rawXml: string): TypesAnalizateXml.ICategories[] => {
  if (!xml?.categories || !xml?.offers) return [];

  const categoriesRaw = Array.isArray(xml.categories.category)
    ? xml.categories.category
    : [xml.categories.category];

  const productsRaw = Array.isArray(xml.offers.offer)
    ? xml.offers.offer
    : [xml.offers.offer];

  const productsByCategory = new Map<number, TypesAnalizateXml.IProduct[]>();

  for (const product of productsRaw) {
    const categoryId = Number(product.categoryId);
    const prodId = Number(product["@_id"]);

    const normalizedProduct: TypesAnalizateXml.IProduct = {
      id: prodId,
      available: product["@_available"] === "true",
      name: product.name,
      description: product.description ?? "",
      picture: product.picture ?? [],
      parameters: normalizeParameters(product),
      categoryId,
      searchReq: `<offer id="${prodId}" `,
    };

    if (!productsByCategory.has(categoryId)) {
      productsByCategory.set(categoryId, []);
    }

    productsByCategory.get(categoryId)!.push(normalizedProduct);
  }

  return categoriesRaw.map((category: any) => {
    const id = Number(category["@_id"]);

    return {
      id,
      name: category["#text"],
      products: productsByCategory.get(id) ?? [],
      searchReq: `<category id="${id}"`
    };
  });
}

const normalizeParameters = (xmlProduct: any): TypesAnalizateXml.IParameter[] => {
  if (!xmlProduct?.parameters) return [];

  const parametersRaw = Array.isArray(xmlProduct.parameters.parameter)
    ? xmlProduct.parameters.parameter
    : [xmlProduct.parameters.parameter];

  const parameters = [];

  for (const param of parametersRaw) {

    const normalizedParameter: TypesAnalizateXml.IParameter = {
      id: Number(param["@_id"]),
      price: param.price ?? null,
      description: param.description ?? null,
      descriptionIndex: param.descriptionIndex ?? null
    };

    parameters.push(normalizedParameter);
  };

  return parameters;
}