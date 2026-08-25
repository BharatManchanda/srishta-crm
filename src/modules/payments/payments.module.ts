import { Module, forwardRef } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { RazorpayService } from './razorpay.service';
import { JwtModule } from '../jwt/jwt.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentFilterBuilder } from './payment-filter.builder';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { PaymentPolicy } from './payments.policy';
import { UserModule } from '../user/user.module';

@Module({
  imports: [PrismaModule, JwtModule, forwardRef(() => UserModule)],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentPolicy, RazorpayService, PaymentFilterBuilder, UserHierarchyService, PaginationService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
