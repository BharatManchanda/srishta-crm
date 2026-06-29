import { Module } from '@nestjs/common';
import { ModuleService } from './module.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ModuleService],
  exports: [ModuleService],
})
export class ModuleModule {}
