/**
 * Convert service - handles file conversion to universal format
 */

import { Readable } from 'stream';
import { UniversalProductData } from './domain/models';
import { ColumnMappingConfig, ColumnType } from './convert.dto';
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
    mappings: ColumnMappingConfig
  ): Promise<UniversalProductData> {
    const parser = FileParserFactory.createParser(mimeType, filename);
    const rows: Array<{ [columnIndex: number]: string | number }> = [];

    await parser.parse(fileStream, (row) => {
      rows.push(row);
    });

    return TableMapper.mapToUniversalFormat(rows, mappings);
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
    mappings?: ColumnMappingConfig;
  }) {
    const { fileBuffer, mimeType, filename, sourceType, targetType, mappings = { columns: [], characteristic: [] } } = params;

    let universal: UniversalProductData;

    if (sourceType === 'table') {
      const validation = this.validateMappings(mappings);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const stream = new Readable();
      stream.push(fileBuffer);
      stream.push(null);
      universal = await this.parseTableToUniversal(stream, mimeType, filename, mappings);
    } else {
      const xml = fileBuffer.toString('utf-8');
      universal = await this.parseXmlToUniversal(xml, sourceType);
    }

    return this.buildOutput(universal, targetType);
  }

  validateMappings(mappings: ColumnMappingConfig): { valid: boolean; error?: string } {
    if (!mappings || !Array.isArray(mappings.columns) || mappings.columns.length === 0) {
      return { valid: false, error: 'No column mappings provided' };
    }

    const indices = [
      ...mappings.columns.map((m) => m.columnIndex),
      ...(mappings.characteristic ?? []).flatMap((m) =>
        m.unitIndex !== undefined ? [m.columnIndex, m.unitIndex] : [m.columnIndex]
      ),
    ];
    const uniqueIndices = new Set(indices);
    if (indices.length !== uniqueIndices.size) {
      return { valid: false, error: 'Duplicate column indices found' };
    }

    const hasProductMapping = mappings.columns.some((m) => m.columnType === ColumnType.PRODUCT_NAME);

    if (!hasProductMapping) {
      return {
        valid: false,
        error: 'At least one product-related column mapping is required',
      };
    }

    const hasCharacteristic = (mappings.characteristic ?? []).length > 0;
    if (hasCharacteristic) {
      const characteristicIndexes = new Set((mappings.characteristic ?? []).map((item) => item.columnIndex));
      const invalidUnit = (mappings.characteristic ?? []).some(
        (item) => item.unitIndex !== undefined && !characteristicIndexes.has(item.columnIndex)
      );
      if (invalidUnit) {
        return { valid: false, error: 'Invalid characteristic-unit mappings' };
      }
    }

    return { valid: true };
  }
}
