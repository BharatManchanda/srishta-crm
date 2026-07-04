export function parseBoolean(value: unknown): boolean {
    if (value === null || value === undefined || value === '') {
        return false;
    }

    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'number') {
        return value !== 0;
    }

    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();

        if (['true', 'yes', 'y', '1'].includes(normalized)) {
            return true;
        }

        if (['false', 'no', 'n', '0'].includes(normalized)) {
            return false;
        }
    }

    return false;
}