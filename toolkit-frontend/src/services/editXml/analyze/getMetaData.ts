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
      range: g.range
    })),
    types: Array.from(typeCounter.entries()).map(([type, quantity]) => ({
      name: type,
      quantity
    }))
  };

  const modifiersMD: TypesAnalizateXml.IDefaultMD = {
    quantity: modifiersGroups.flatMap(modGroup => modGroup.modifiers).length,
    names: modifiersGroups.flatMap(modGroup => modGroup.modifiers.map(mod => ({
      name: `${modGroup.name} | ${mod.name} - ${mod.price}`,
      range: mod.range,
    }))),
  };

  const categoriesMD: TypesAnalizateXml.IDefaultMD = {
    quantity: categories.length,
    names: categories.map(cat => ({
      name: cat.name,
      range: cat.range
    })),
  };

  const offersWithParamsCount = normalizeData.categories.flatMap(
    (category) =>
      category.products.map((product) => ({
        quantityParams: product.parameters.length,
        offerName: `${category.name} | ${product.name}`,
        range: product.range
      }))
  );

  const paramsCountMap = new Map<number, string[]>();

  for (const offer of offersWithParamsCount) {
    if (!paramsCountMap.has(offer.quantityParams)) {
      paramsCountMap.set(offer.quantityParams, []);
    }
    paramsCountMap.get(offer.quantityParams)!.push(offer.offerName);
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
      false: allParameters.filter(p => p.price === null || p.price === 0).length
    },

    description: {
      true: allParameters.filter(p => p.description && p.description !== "").length,
      false: allParameters.filter(p => !p.description || p.description === "").length
    },

    descriptionIndex: {
      true: allParameters.filter(p => p.descriptionIndex !== null && p.descriptionIndex !== 0).length,
      false: allParameters.filter(p => p.descriptionIndex === null || p.descriptionIndex === 0).length
    },

    data: parametersData
  };

  const offersWithUrls = categories.flatMap(
    (category) =>
      category.products.map((product) => ({
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
      range: offer.range
    })),
    description: {
      true: offers.filter(o => o.description).length,
      false: offers.filter(o => !o.description || !o.description).length
    },
    picture: {
      true: trueUrls.length,
      false: falseUrls.length,
      trueData: trueUrls.map(offer => ({
        url: offer.url,
        name: offer.offerName,
      })),
      falseData: falseUrls.map(offer => ({
        url: offer.url,
        name: offer.offerName,
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