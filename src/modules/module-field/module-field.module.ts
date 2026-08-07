import { Module } from '@nestjs/common';
import { ModuleFieldController } from './module-field.controller';
import { ModuleFieldService } from './module-field.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '../jwt/jwt.module';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { ModuleFieldFilterBuilder } from './module-field-filter.builder';
import { UserHierarchyService } from '../user/user-hierarchy.service';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [ModuleFieldController],
  providers: [ModuleFieldService, PaginationService, ModuleFieldFilterBuilder, UserHierarchyService]
})
export class ModuleFieldModule {}
