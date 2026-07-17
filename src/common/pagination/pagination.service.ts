import { Injectable } from '@nestjs/common';

@Injectable()
export class PaginationService {
  async paginate<T>(
    model: any,
    options: {
      page?: number;
      perPage?: number;
      paginate?: boolean;
      where?: any;
      orderBy?: any;
      include?: any;
      select?: any;
    },
  ) {
    const shouldPaginate = options.paginate !== false;
    const page = options.page || 1;
    const limit = options.perPage || 10;
    const skip = (page - 1) * limit;

    const query: any = {
      where: options.where,
      orderBy: options.orderBy,
      include: options.include,
      select: options.select,
    };
    
    if (shouldPaginate) {
      query.skip = skip;
      query.take = limit;
    }

    const [data, total] = await Promise.all([
      model.findMany(query),
      model.count({
        where: options.where,
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page: shouldPaginate ? page : 1,
        limit: shouldPaginate ? limit : total,
        totalPages: shouldPaginate ? Math.ceil(total / limit) : 1,
      },
    };
  }
}