import { Module } from '@nestjs/common';
import { BlogsController } from './blogs.controller';
import { BlogsService } from './blogs.service';
import { BlogsFilterBuilder } from './blogs-filter.builder';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '../jwt/jwt.module';
import { StorageService } from 'src/common/storage/storage.service';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [BlogsController],
  providers: [BlogsService, BlogsFilterBuilder, PaginationService, StorageService]
})
export class BlogsModule {}
