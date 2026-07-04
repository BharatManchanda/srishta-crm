import { ImportJob } from '@prisma/client';

export interface BulkImporter {
  import(rows: Record<string, any>[], importJob: ImportJob): Promise<void>;
}