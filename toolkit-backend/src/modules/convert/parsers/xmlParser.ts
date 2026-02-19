/**
 * XML parser with streaming support
 */

import { Readable } from 'stream';
import { FileParser, TableRow } from './fileParser';
import * as xml2js from 'xml2js';

export class XmlParser implements FileParser {
  async parse(stream: Readable, onRow: (row: TableRow) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      let xmlData = '';

      stream.on('data', (chunk: Buffer) => {
        xmlData += chunk.toString('utf-8');
      });

      stream.on('end', async () => {
        try {
          const parser = new xml2js.Parser({
            explicitArray: true,
            mergeAttrs: true,
          });

          const result = await parser.parseStringPromise(xmlData);
          const rows = this.extractRowsFromXml(result);
          rows.forEach((row) => onRow(row));
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      stream.on('error', reject);
    });
  }

  private extractRowsFromXml(xmlData: any): TableRow[] {
    const rows: TableRow[] = [];

    // Try to find common XML table structures
    // This is a generic implementation - may need customization based on actual XML structure
    const findRows = (obj: any, path: string[] = []): void => {
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => findRows(item, [...path, index.toString()]));
      } else if (typeof obj === 'object' && obj !== null) {
        // Check if this looks like a row (has multiple properties)
        const keys = Object.keys(obj);
        if (keys.length > 1 && !keys.some((k) => typeof obj[k] === 'object')) {
          const row: TableRow = {};
          keys.forEach((key, index) => {
            const value = obj[key];
            if (Array.isArray(value) && value.length > 0) {
              row[index] = String(value[0]);
            } else if (value !== null && value !== undefined) {
              row[index] = String(value);
            }
          });
          if (Object.keys(row).length > 0) {
            rows.push(row);
          }
        } else {
          keys.forEach((key) => {
            findRows(obj[key], [...path, key]);
          });
        }
      }
    };

    findRows(xmlData);
    return rows;
  }
}
