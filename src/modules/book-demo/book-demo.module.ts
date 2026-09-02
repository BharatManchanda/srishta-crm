import { Module } from '@nestjs/common';
import { BookDemoController } from './book-demo.controller';
import { BookDemoService } from './book-demo.service';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '../jwt/jwt.module';
import { BookDemoFilterBuilder } from './book-demo-filter.builder';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [BookDemoController],
  providers: [BookDemoService, PaginationService, BookDemoFilterBuilder],
})
export class BookDemoModule {}