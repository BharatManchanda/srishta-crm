import { Injectable } from '@nestjs/common';

@Injectable()
export class PaginationService {
    async paginate<T>(
        model: any,
        options: {
            page?: number;
            perPage?: number;
            where?: any;
            orderBy?: any;
            include?: any;
            select?: any;
        },
    ) {
        const page = options.page || 1;
        const limit = options.perPage || 10;

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            model.findMany({
                skip,
                take: limit,
                where: options.where,
                orderBy: options.orderBy,
                include: options.include,
                select: options.select,
            }),

            model.count({
                where: options.where,
            }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}