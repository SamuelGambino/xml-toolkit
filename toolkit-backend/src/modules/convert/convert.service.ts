/**
 * Convert service - handles file conversion to universal format
 */

import { Readable } from 'stream';
import { UniversalProductData } from './domain/models';
import { ColumnMapping, ColumnType, ProductParameterMapping } from './convert.dto';
import { FileParserFactory } from './parsers/fileParser';
import { TableMapper } from './mappers/tableMapper';
import { OutputBuilders, TargetType } from './builders/outputBuilders';
import { UniversalXmlParser, XmlSourceType } from './parsers/universalXmlParser';

export type SourceType = 'table' | XmlSourceType;

export class ConvertService {
  async parseTableToUniversal(
    fileStream: Readable,
    mimeType: string,
    filename: string,
    mappings: ColumnMapping[],
    productParameters: ProductParameterMapping[] = []
  ): Promise<UniversalProductData> {
    const parser = FileParserFactory.createParser(mimeType, filename);
    const rows: Array<{ [columnIndex: number]: string | number }> = [];

    await parser.parse(fileStream, (row) => {
      rows.push(row);
    });

    return TableMapper.mapToUniversalFormat(rows, mappings, productParameters);
  }

  async parseXmlToUniversal(xml: string, sourceType: XmlSourceType): Promise<UniversalProductData> {
    return UniversalXmlParser.parse(xml, sourceType);
  }

  buildOutput(data: UniversalProductData, targetType: TargetType) {
    return OutputBuilders.build(data, targetType);
  }

  async convertByConfig(params: {
    fileBuffer: Buffer;
    mimeType: string;
    filename: string;
    sourceType: SourceType;
    targetType: TargetType;
    mappings?: ColumnMapping[];
    productParameters?: ProductParameterMapping[];
  }) {
    const { fileBuffer, mimeType, filename, sourceType, targetType, mappings = [], productParameters = [] } = params;

    let universal: UniversalProductData;

    if (sourceType === 'table') {
      const validation = this.validateMappings(mappings);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const stream = new Readable();
      stream.push(fileBuffer);
      stream.push(null);
      universal = await this.parseTableToUniversal(stream, mimeType, filename, mappings, productParameters);
    } else {
      const xml = fileBuffer.toString('utf-8');
      universal = await this.parseXmlToUniversal(xml, sourceType);
    }

    return this.buildOutput(universal, targetType);
  }

  validateMappings(mappings: ColumnMapping[]): { valid: boolean; error?: string } {
    if (!mappings || mappings.length === 0) {
      return { valid: false, error: 'No column mappings provided' };
    }

    const indices = mappings.map((m) => m.columnIndex);
    const uniqueIndices = new Set(indices);
    if (indices.length !== uniqueIndices.size) {
      return { valid: false, error: 'Duplicate column indices found' };
    }

    const hasProductMapping = mappings.some((m) => m.columnType === ColumnType.PRODUCT_NAME);

    if (!hasProductMapping) {
      return {
        valid: false,
        error: 'At least one product-related column mapping is required',
      };
    }

    return { valid: true };
  }
}
