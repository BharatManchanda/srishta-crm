import { Injectable } from '@nestjs/common';
import { BlogsFilterDto } from './dto/blogs-filter.dto';
import { PrismaFilter } from 'src/common/filters/prisma-filter.helper';

@Injectable()
export class BlogsFilterBuilder {
  build(dto: BlogsFilterDto) {
    const where: any = {
      id: PrismaFilter.equals(dto.id),
      title: PrismaFilter.contains(dto.title),
      slug: PrismaFilter.contains(dto.slug),
      excerpt: PrismaFilter.contains(dto.excerpt),
      content: PrismaFilter.contains(dto.content),
      metaTitle: PrismaFilter.contains(dto.metaTitle),
      metaDescription: PrismaFilter.contains(dto.metaDescription),
      canonicalUrl: PrismaFilter.contains(dto.canonicalUrl),
      status: PrismaFilter.contains(dto.status),
      categoryId: PrismaFilter.equals(dto.categoryId),
      isFeatured: PrismaFilter.equals(dto.isFeatured),
      // publishedAt: PrismaFilter.contains(dto.publishedAt),
    };

    return where;
  }
}
