import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import csv from 'csv-parser';
import { StorageService } from 'src/common/storage/storage.service';
import * as XLSX from 'xlsx';

@Injectable()
export class CsvParserService {
    constructor(
        private readonly storageService: StorageService,
    ) {}

    async parse(storageKey: string, mimeType?: string): Promise<Record<string, any>[]> {
        if (this.isExcelFile(storageKey, mimeType)) {
            return this.parseExcel(storageKey);
        }

        return this.parseCsv(storageKey);
    }

    private async parseCsv(storageKey: string): Promise<Record<string, any>[]> {
        const object = await this.storageService.getObject(storageKey);
        const stream = object.Body as Readable;

        return new Promise((resolve, reject) => {
            const rows: Record<string, any>[] = [];

            stream.pipe(csv()).on('data', (row) => {
                rows.push(row);
            }).on('end', () => {
                resolve(rows);
            }).on('error', reject);
        });
    }

    private async parseExcel(storageKey: string): Promise<Record<string, any>[]> {
        const object = await this.storageService.getObject(storageKey);
        const buffer = await this.streamToBuffer(object.Body as Readable);
        const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];

        if (!firstSheetName) {
            return [];
        }

        const sheet = workbook.Sheets[firstSheetName];
        const table = XLSX.utils.sheet_to_json<Array<string | number | boolean | Date | null>>(sheet, {
            header: 1,
            defval: '',
            raw: false,
        });

        const nonEmptyRows = table.filter((row) =>
            row.some((cell) => String(cell ?? '').trim() !== ''),
        );

        if (nonEmptyRows.length === 0) {
            return [];
        }

        const headers = nonEmptyRows[0].map((header) => String(header ?? '').trim());

        return nonEmptyRows.slice(1).map((cols) => {
            const record: Record<string, any> = {};
            headers.forEach((header, index) => {
                record[header] = String(cols[index] ?? '').trim();
            });
            return record;
        });
    }

    private streamToBuffer(stream: Readable): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];

            stream.on('data', (chunk) => {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            });
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', reject);
        });
    }

    private isExcelFile(storageKey: string, mimeType?: string): boolean {
        const normalizedKey = storageKey.toLowerCase();
        const normalizedMimeType = mimeType?.toLowerCase();

        return (
            normalizedKey.endsWith('.xlsx') ||
            normalizedKey.endsWith('.xls') ||
            normalizedMimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            normalizedMimeType === 'application/vnd.ms-excel'
        );
    }
}
