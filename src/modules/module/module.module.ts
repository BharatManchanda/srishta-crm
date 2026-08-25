import { forwardRef, Module } from '@nestjs/common';
import { ModuleService } from './module.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { UserModule } from '../user/user.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PrismaModule, PaymentsModule, forwardRef(() => UserModule)],
  providers: [ModuleService, UserHierarchyService],
  exports: [ModuleService],
})
export class ModuleModule {}
