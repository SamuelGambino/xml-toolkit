/**
 * CSV parser with streaming support
 */

import { Readable } from 'stream';
import { FileParser, TableRow } from './fileParser';
import * as csv from 'csv-parser';

export class CsvParser implements FileParser {
  async parse(stream: Readable, onRow: (row: TableRow) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      stream
        .pipe(csv({ headers: false, skipEmptyLines: true }))
        .on('data', (data: any) => {
          const tableRow: TableRow = {};
          Object.values(data).forEach((value: any, index: number) => {
            if (value !== null && value !== undefined && value !== '') {
              tableRow[index] = String(value).trim();
            }
          });

          if (Object.keys(tableRow).length > 0) {
            onRow(tableRow);
          }
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }
}
