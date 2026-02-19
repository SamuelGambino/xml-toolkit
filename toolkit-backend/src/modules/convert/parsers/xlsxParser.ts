/**
 * XLSX/XLS parser with streaming support for large files
 */

import { Readable } from 'stream';
import { FileParser, TableRow } from './fileParser';
import * as XLSX from 'xlsx';

export class XlsxParser implements FileParser {
  async parse(stream: Readable, onRow: (row: TableRow) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.on('end', () => {
        try {
          const buffer = Buffer.concat(chunks);
          const workbook = XLSX.read(buffer, {
            type: 'buffer',
            cellDates: true,
            cellNF: false,
            cellText: false,
          });

          // Use the first sheet
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) {
            reject(new Error('No sheets found in Excel file'));
            return;
          }

          const worksheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            raw: false,
          }) as any[][];

          // Convert to TableRow format
          rows.forEach((row) => {
            const tableRow: TableRow = {};
            row.forEach((cell, index) => {
              if (cell !== null && cell !== undefined && cell !== '') {
                tableRow[index] = cell;
              }
            });
            if (Object.keys(tableRow).length > 0) {
              onRow(tableRow);
            }
          });

          resolve();
        } catch (error) {
          reject(error);
        }
      });

      stream.on('error', reject);
    });
  }
}
