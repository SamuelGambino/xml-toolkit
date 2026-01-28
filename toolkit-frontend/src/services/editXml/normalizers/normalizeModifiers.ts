import TypesAnalizateXml from "../TypesAnalizateXml";

export const normalizeModifiers = (xml: any, rawXml: string): TypesAnalizateXml.IModifiersGroup[] => {
  if (!xml?.modifiersGroups || !xml?.modifiers) {
    return [];
  }

  const groups = Array.isArray(xml.modifiersGroups.modifiersGroup)
    ? xml.modifiersGroups.modifiersGroup
    : [xml.modifiersGroups.modifiersGroup];

  const modifiers = Array.isArray(xml.modifiers.modifier)
    ? xml.modifiers.modifier
    : [xml.modifiers.modifier];

  const modifiersByGroupId = new Map<number, TypesAnalizateXml.IModifier[]>();

  for (const mod of modifiers) {
    const groupId = Number(mod.modifiersGroupId);
    const modId = Number(mod["@_id"]);

    const normalizedModifier: TypesAnalizateXml.IModifier = {
      id: modId,
      name: mod.name,
      price: Number(mod.price),
      required: mod["@_required"] === "true",
      searchReq: `<modifier id="${modId}"`
    };

    if (!modifiersByGroupId.has(groupId)) {
      modifiersByGroupId.set(groupId, []);
    }

    modifiersByGroupId.get(groupId)!.push(normalizedModifier);
  }

  return groups.map((group: any) => {
    const id = Number(group["@_id"]);

    return {
      id,
      name: group.name,
      type: group.type,
      minimum: Number(group.minimum),
      maximum: Number(group.maximum),
      modifiers: modifiersByGroupId.get(id) ?? [],
      searchReq: `<modifiersGroup id="${id}"`
    };
  });
}
