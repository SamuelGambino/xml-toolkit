import { ColumnType } from '../convert.dto';

type XmlDomain = 'yml' | 'extended_yml' | 'google_feed';

interface XmlFieldConfig {
  parent_tag: string;
  tag: string;
  attribute?: string;
}

const XML_FIELD_CONFIG: Partial<Record<ColumnType, Partial<Record<XmlDomain, XmlFieldConfig>>>> = {
  [ColumnType.CATEGORY_ID]: {
    yml: { parent_tag: 'categories', tag: 'category', attribute: 'id' },
    extended_yml: { parent_tag: 'categories', tag: 'category', attribute: 'id' },
    google_feed: { parent_tag: 'item', tag: 'g:google_product_category' },
  },
  [ColumnType.PRODUCT_ID]: {
    yml: { parent_tag: 'offer', tag: 'offer', attribute: 'id' },
    extended_yml: { parent_tag: 'item', tag: 'item', attribute: 'id' },
    google_feed: { parent_tag: 'item', tag: 'g:id' },
  },
  [ColumnType.PRODUCT_NAME]: {
    yml: { parent_tag: 'offer', tag: 'name' },
    extended_yml: { parent_tag: 'item', tag: 'name' },
    google_feed: { parent_tag: 'item', tag: 'g:title' },
  },
  [ColumnType.PRODUCT_DESCRIPTION]: {
    yml: { parent_tag: 'offer', tag: 'description' },
    extended_yml: { parent_tag: 'item', tag: 'description' },
    google_feed: { parent_tag: 'item', tag: 'g:description' },
  },
  [ColumnType.PRODUCT_LINK]: {
    yml: { parent_tag: 'offer', tag: 'url' },
    extended_yml: { parent_tag: 'item', tag: 'url' },
    google_feed: { parent_tag: 'item', tag: 'g:link' },
  },
  [ColumnType.PRODUCT_IMAGE]: {
    yml: { parent_tag: 'offer', tag: 'picture' },
    extended_yml: { parent_tag: 'item.images', tag: 'large' },
    google_feed: { parent_tag: 'item', tag: 'g:image_link' },
  },
  [ColumnType.PRODUCT_PARAMETER_ID]: {
    yml: { parent_tag: 'offer.parameters', tag: 'parameter', attribute: 'id' },
    extended_yml: { parent_tag: 'item.parameters', tag: 'parameter', attribute: 'id' },
    google_feed: { parent_tag: 'item', tag: 'g:id' },
  },
  [ColumnType.PRODUCT_PARAMETER_PRICE]: {
    yml: { parent_tag: 'offer.parameters.parameter', tag: 'price' },
    extended_yml: { parent_tag: 'item.parameters.parameter', tag: 'price' },
    google_feed: { parent_tag: 'item', tag: 'g:price' },
  },
};

export const getXmlFieldConfig = (domain: XmlDomain, columnType: ColumnType): XmlFieldConfig | undefined =>
  XML_FIELD_CONFIG[columnType]?.[domain];
