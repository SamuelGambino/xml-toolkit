import TypesAnalizateXml from "../TypesAnalizateXml"

export const getMetaData = (normalizeData: TypesAnalizateXml.INormalizeXml): TypesAnalizateXml.IMetaData => {
  const modifiersGroups = normalizeData.modifiersGroups;
  const categories = normalizeData.categories;

  const typeCounter = new Map<string, number>();

  for (const group of modifiersGroups) {
    typeCounter.set(
      group.type,
      (typeCounter.get(group.type) ?? 0) + 1
    );
  }

  const modifiersGroupsMD: TypesAnalizateXml.IModGroupsMD = {
    quantity: modifiersGroups.length,
    names: modifiersGroups.map(g => ({
      name: g.name,
      searchReq: g.searchReq
    })),
    types: Array.from(typeCounter.entries()).map(([type, quantity]) => ({
      name: type,
      quantity,
      searchReq: `<type>${type}</type>`
    }))
  };

  const modifiersMD: TypesAnalizateXml.IDefaultMD = {
    quantity: modifiersGroups.flatMap(modGroup => modGroup.modifiers).length,
    names: modifiersGroups.flatMap(modGroup => modGroup.modifiers.map(mod => ({
      name: `${modGroup.name} | ${mod.name} - ${mod.price}`,
      searchReq: mod.searchReq,
    }))),
  };

  const categoriesMD: TypesAnalizateXml.IDefaultMD = {
    quantity: categories.length,
    names: categories.map(cat => ({
      name: cat.name,
      searchReq: cat.searchReq
    })),
  };

  const offersWithParamsCount = normalizeData.categories.flatMap(
    (category) =>
      category.products.map((product) => ({
        quantityParams: product.parameters.length,
        offerName: `${category.name} | ${product.name}`,
        searchReq: product.searchReq
      }))
  );

  const paramsCountMap = new Map<number, { name: string, searchReq: string | null }[]>();

  for (const offer of offersWithParamsCount) {
    if (!paramsCountMap.has(offer.quantityParams)) {
      paramsCountMap.set(offer.quantityParams, []);
    }
    paramsCountMap.get(offer.quantityParams)!.push({ name: offer.offerName, searchReq: offer.searchReq });
  };

  const parametersData = Array.from(paramsCountMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([quantityParams, offers]) => ({
      quantityParams,
      offersWhoHas: offers.length,
      offers
    }));

  const allParameters = normalizeData.categories
    .flatMap(cat => cat.products)
    .flatMap(prod => prod.parameters);

  const parameterMD: TypesAnalizateXml.IParameterMD = {
    quantity: allParameters.length,

    price: {
      true: allParameters.filter(p => p.price !== null && p.price !== 0).length,
      false: allParameters.filter(p => p.price === null || p.price === 0).length,
      searchReq: {
        true: `<price>\s*[^<]+\s*</price>`,
        false: `<price>\s*</price>`
      }
    },

    description: {
      true: allParameters.filter(p => p.description && p.description !== "").length,
      false: allParameters.filter(p => !p.description || p.description === "").length,
      searchReq: {
        true: `<description>\s*[^<]+\s*</description>`,
        false: `<description>\s*</description>>`
      }
    },

    descriptionIndex: {
      true: allParameters.filter(p => p.descriptionIndex !== null && p.descriptionIndex !== 0).length,
      false: allParameters.filter(p => p.descriptionIndex === null || p.descriptionIndex === 0).length,
      searchReq: {
        true: `<descriptionIndex>\s*[^<]+\s*</descriptionIndex>`,
        false: `<descriptionIndex>\s*</descriptionIndex>`
      }
    },

    data: parametersData
  };

  const offersWithUrls = categories.flatMap(
    (category) =>
      category.products.map((product) => ({
        prodId: product.id,
        offerName: `${category.name} | ${product.name}`,
        url: product.picture,
      }))
  );

  const trueUrls = offersWithUrls.filter(offer => offer.url && offer.url !== "");
  const falseUrls = offersWithUrls.filter(offer => !offer.url || offer.url === "");

  const offers = categories.flatMap(cat => cat.products);

  const offersMD: TypesAnalizateXml.IOffersMD = {
    quantity: offers.length,
    names: offersWithParamsCount.map(offer => ({
      name: offer.offerName,
      searchReq: offer.searchReq
    })),
    description: {
      true: offers.filter(o => o.description).length,
      false: offers.filter(o => !o.description || !o.description).length,
      searchReq: {
        true: `<description>\s*[^<]+\s*</description>`,
        false: `<description>\s*</description>`
      }
    },
    picture: {
      true: trueUrls.length,
      false: falseUrls.length,
      trueData: trueUrls.map(offer => ({
        url: offer.url,
        name: offer.offerName,
        searchReq: `<offer id="${offer.prodId}"`
      })),
      falseData: falseUrls.map(offer => ({
        url: offer.url,
        name: offer.offerName,
        searchReq: `<offer id="${offer.prodId}"`
      })),
    },
    parameters: parameterMD,
    categoryId: {
      true: offers.filter(offer => offer.categoryId !== null && offer.categoryId !== 0 || offer.categoryId && offer.categoryId !== "").length,
      false: offers.filter(offer => offer.categoryId === null || offer.categoryId === 0 || !offer.categoryId || offer.categoryId === "").length
    }
  };

  return {
    modifiersGroups: modifiersGroupsMD,
    modifiers: modifiersMD,
    categories: categoriesMD,
    offers: offersMD
  }
}