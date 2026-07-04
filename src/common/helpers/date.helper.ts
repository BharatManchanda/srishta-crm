import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const DATE_FORMATS = [
  // ISO
  'YYYY-MM-DD',
  'YYYY/MM/DD',
  'YYYY.MM.DD',

  // Date only
  'DD/MM/YYYY',
  'MM/DD/YYYY',
  'DD-MM-YYYY',
  'MM-DD-YYYY',
  'DD.MM.YYYY',
  'MM.DD.YYYY',

  // Short year
  'DD/MM/YY',
  'MM/DD/YY',
  'DD-MM-YY',
  'MM-DD-YY',

  // Month names
  'DD MMM YYYY',
  'DD MMMM YYYY',
  'MMM DD YYYY',
  'MMMM DD YYYY',

  // ISO DateTime
  'YYYY-MM-DDTHH:mm:ss',
  'YYYY-MM-DDTHH:mm:ssZ',
  'YYYY-MM-DDTHH:mm:ss.SSSZ',

  // 24-hour
  'YYYY-MM-DD HH:mm',
  'YYYY-MM-DD HH:mm:ss',
  'YYYY/MM/DD HH:mm',
  'YYYY/MM/DD HH:mm:ss',

  'DD/MM/YYYY HH:mm',
  'DD/MM/YYYY HH:mm:ss',
  'MM/DD/YYYY HH:mm',
  'MM/DD/YYYY HH:mm:ss',

  'DD-MM-YYYY HH:mm',
  'DD-MM-YYYY HH:mm:ss',
  'MM-DD-YYYY HH:mm',
  'MM-DD-YYYY HH:mm:ss',

  // 12-hour
  'DD/MM/YYYY hh:mm A',
  'MM/DD/YYYY hh:mm A',
  'DD-MM-YYYY hh:mm A',
  'MM-DD-YYYY hh:mm A',

  'YYYY-MM-DD hh:mm A',

  // Month name + time
  'DD MMM YYYY HH:mm',
  'DD MMM YYYY HH:mm:ss',
  'DD MMM YYYY hh:mm A',

  'DD MMMM YYYY HH:mm',
  'DD MMMM YYYY hh:mm A',
];

export function parseDate(value: unknown): Date | null {
    if (value == null || value === '') {
        return null;
    }

    if (value instanceof Date) {
        return value;
    }

    // Excel serial date
    if (typeof value === 'number') {
        return new Date(Math.round((value - 25569) * 86400 * 1000));
    }

    if (typeof value !== 'string') {
        throw new Error(`Unsupported date type: ${typeof value}`);
    }

    const input = value.trim();

    // Try ISO parsing first
    const iso = dayjs(input);

    if (iso.isValid()) {
        return iso.toDate();
    }

    // Try known formats
    for (const format of DATE_FORMATS) {
        const parsed = dayjs(input, format, true);

        if (parsed.isValid()) {
            return parsed.toDate();
        }
    }

    throw new Error(`Invalid date: ${value}`);
}