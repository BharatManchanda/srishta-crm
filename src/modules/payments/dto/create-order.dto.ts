import { BillingCycle } from '@prisma/client';
import { IsEnum, IsInt } from 'class-validator';

export class CreateOrderDto {
  @IsInt()
  pricingPlanId: number;

  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;
}