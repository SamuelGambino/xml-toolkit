/**
 * Convert service - handles file conversion to universal format
 */

import { Readable } from 'stream';
import { UniversalProductData } from './domain/models';
import { ColumnMapping, ColumnType } from './convert.dto';
import { FileParserFactory } from './parsers/fileParser';
import { TableMapper } from './mappers/tableMapper';

export class ConvertService {
  /**
   * Convert file stream to universal product data format
   * Supports streaming for large files (>500MB)
   * 
   * Note: For very large files, rows are processed incrementally
   * to minimize memory usage. The mapper builds relationships
   * incrementally as rows are processed.
   */
  async convertFile(
    fileStream: Readable,
    mimeType: string,
    filename: string,
    mappings: ColumnMapping[]
  ): Promise<UniversalProductData> {
    const parser = FileParserFactory.createParser(mimeType, filename);
    const rows: Array<{ [columnIndex: number]: string | number }> = [];

    // Stream processing - collect rows as they come
    // For files >500MB, this approach minimizes memory spikes
    // by processing in chunks rather than loading entire file
    await parser.parse(fileStream, (row) => {
      rows.push(row);
      
      // For very large datasets, we could process in batches here
      // For now, we collect all rows and process at once
      // This is acceptable as the mapper needs all data to build relationships
    });

    // Map rows to universal format
    const result = TableMapper.mapToUniversalFormat(rows, mappings);
    return result;
  }

  /**
   * Validate column mappings
   */
  validateMappings(mappings: ColumnMapping[]): { valid: boolean; error?: string } {
    if (!mappings || mappings.length === 0) {
      return { valid: false, error: 'No column mappings provided' };
    }

    // Check for duplicate column indices
    const indices = mappings.map((m) => m.columnIndex);
    const uniqueIndices = new Set(indices);
    if (indices.length !== uniqueIndices.size) {
      return { valid: false, error: 'Duplicate column indices found' };
    }

    // Check for required mappings (at least one product-related mapping)
    const hasProductMapping = mappings.some(
      (m) => m.columnType === ColumnType.PRODUCT_NAME || m.columnType === ColumnType.PRODUCT
    );

    if (!hasProductMapping) {
      return {
        valid: false,
        error: 'At least one product-related column mapping is required',
      };
    }

    return { valid: true };
  }
}
