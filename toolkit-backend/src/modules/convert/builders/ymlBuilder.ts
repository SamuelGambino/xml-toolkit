import * as xml2js from 'xml2js';
import { UniversalProductData } from '../domain/models';
import { createShopPayload } from './xmlShared';

export class YmlBuilder {
  static build(data: UniversalProductData): string {
    const payload = {
      yml_catalog: {
        $: { date: new Date().toISOString() },
        shop: createShopPayload(data),
      },
    };

    const builder = new xml2js.Builder({ headless: false });
    return builder.buildObject(payload);
  }
}
