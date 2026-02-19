/**
 * File parser interface and factory
 */

import { Readable } from 'stream';
import { XmlParser } from './xmlParser';
import { XlsxParser } from './xlsxParser';
import { CsvParser } from './csvParser';

export interface TableRow {
  [columnIndex: number]: string | number;
}

export interface FileParser {
  /**
   * Parse file stream into table rows
   * @param stream File stream
   * @param onRow Callback for each row
   * @returns Promise that resolves when parsing is complete
   */
  parse(stream: Readable, onRow: (row: TableRow) => void): Promise<void>;
}

export class FileParserFactory {
  static createParser(mimeType: string, filename: string): FileParser {
    const extension = filename.split('.').pop()?.toLowerCase();

    if (
      mimeType === 'application/xml' ||
      mimeType === 'text/xml' ||
      extension === 'xml'
    ) {
      return new XmlParser();
    }

    if (
      mimeType ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel' ||
      extension === 'xlsx' ||
      extension === 'xls'
    ) {
      return new XlsxParser();
    }

    if (
      mimeType === 'text/csv' ||
      mimeType === 'application/csv' ||
      extension === 'csv'
    ) {
      return new CsvParser();
    }

    throw new Error(`Unsupported file type: ${mimeType} (${extension})`);
  }
}
