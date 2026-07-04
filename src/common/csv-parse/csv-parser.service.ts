import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import csv from 'csv-parser';
import { StorageService } from 'src/common/storage/storage.service';

@Injectable()
export class CsvParserService {
    constructor(
        private readonly storageService: StorageService,
    ) {}

    async parse(storageKey: string): Promise<Record<string, any>[]> {
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
}