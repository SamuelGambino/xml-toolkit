import * as xml2js from 'xml2js';
import { UniversalProductData } from '../domain/models';
import { createShopPayload } from './xmlShared';

export class ExtendedYmlBuilder {
  static build(data: UniversalProductData): string {
    const payload = {
      dc_catalog: {
        $: { date: new Date().toISOString() },
        shop: createShopPayload(data),
      },
    };

    const builder = new xml2js.Builder({ headless: false });
    return builder.buildObject(payload);
  }
}
