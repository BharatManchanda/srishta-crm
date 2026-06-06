export class PrismaFilter {
    static contains(value?: string) {
        if (!value) return undefined;

        return {
            contains: value,
            mode: 'insensitive',
        };
    }

    static equals(value?: any) {
        return value ?? undefined;
    }

    static in(values?: any[]) {
        if (!values?.length) return undefined;

        return {
            in: values,
        };
    }

    static range(min?: number, max?: number) {
        const result: any = {};

        if (min !== undefined) result.gte = min;
        if (max !== undefined) result.lte = max;

        return Object.keys(result).length ? result : undefined;
    }

    static dateRange(from?: Date, to?: Date) {
        const result: any = {};

        if (from) result.gte = from;
        if (to) result.lte = to;

        return Object.keys(result).length ? result : undefined;
    }
}