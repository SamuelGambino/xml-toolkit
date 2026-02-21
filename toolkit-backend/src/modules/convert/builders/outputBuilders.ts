import { UniversalProductData } from '../domain/models';
import { DeliveryClubBuilder } from './deliveryClubBuilder';
import { GoogleFeedBuilder } from './googleFeedBuilder';
import { TableBuilder } from './tableBuilder';
import { YmlBuilder } from './ymlBuilder';

export type TargetType = 'table' | 'yml' | 'delivery_club' | 'google_feed';

export interface BuiltFile {
  filename: string;
  mimeType: string;
  content: string;
}

export class OutputBuilders {
  static build(data: UniversalProductData, targetType: TargetType): BuiltFile {
    switch (targetType) {
      case 'table':
        return {
          filename: 'converted.csv',
          mimeType: 'text/csv; charset=utf-8',
          content: TableBuilder.build(data),
        };
      case 'yml':
        return {
          filename: 'converted-yml.xml',
          mimeType: 'application/xml; charset=utf-8',
          content: YmlBuilder.build(data),
        };
      case 'delivery_club':
        return {
          filename: 'converted-delivery-club.xml',
          mimeType: 'application/xml; charset=utf-8',
          content: DeliveryClubBuilder.build(data),
        };
      case 'google_feed':
        return {
          filename: 'converted-google-feed.xml',
          mimeType: 'application/xml; charset=utf-8',
          content: GoogleFeedBuilder.build(data),
        };
      default:
        throw new Error(`Unsupported targetType: ${targetType}`);
    }
  }
}
