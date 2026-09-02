import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { RazorpayService } from './razorpay.service';
import { PrismaService } from '../prisma/prisma.service';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import crypto from 'crypto';
import { PaymentFilterDto } from './dto/payment-filter.dto';
import { PaymentFilterBuilder } from './payment-filter.builder';
import { UserHierarchyService } from '../user/user-hierarchy.service';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { UpdateViewSettingDto } from './dto/update-view-setting.dto';
import { CustomerPlanStatus, PaymentMethod, PricingPlanStatus, Prisma, UserType } from '@prisma/client';
import { UserPolicy } from '../user/user.policy';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class PaymentsService {
    constructor(
        private readonly razorpayService: RazorpayService,
        private readonly prisma: PrismaService,
        private readonly paymentFilterBuilder: PaymentFilterBuilder,
        private readonly userHierarchyService: UserHierarchyService,
        private readonly paginationService: PaginationService,

        @Inject(forwardRef(() => UserPolicy))
        private readonly userPolicy: UserPolicy,

        private readonly redisService: RedisService,
    ) {}
    

    async getList(dto: PaymentFilterDto, currentUser: any) {
        const user = await this.prisma.user.findUnique({
            where: { id: currentUser.id },
            select: { accessLevel: true, userType: true },
        });
    
        const where: any = {
            ...this.paymentFilterBuilder.build(dto),
            id: {
                in: dto.id !== undefined && dto.id ? [dto?.id] : undefined,
            },
        }
    
        if (user?.userType !== UserType.ADMIN) {
            if (user?.accessLevel === 'STANDARD') {
                where.userId = currentUser.id;
            } else {
                const userIds = await this.userHierarchyService.getFamilyUserIds(currentUser.id);
                where.OR = [
                    { userId: { in: userIds } },
                ];
            }
        } else if (user?.userType === UserType.ADMIN && dto?.companyId) {
            const companyUserIds = await this.userHierarchyService.getFamilyUserIds(dto.companyId);
            where.userId = { in: companyUserIds };
        }
    
        const orderBy = dto.sortBy ? { [dto.sortBy]: dto.sortOrder || 'desc' } : { id: 'desc' };
        const result = await this.paginationService.paginate(this.prisma.payment, {
            page: dto.page,
            perPage: dto.perPage,
            paginate: dto?.paginate,
            where,
            orderBy,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                pricingPlan: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            }
        });
    
        return result;
    }

    private generateRandomCode(length = 10): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        let result = '';

        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return result;
    }

    async createOrder(userId: number, dto: CreateOrderDto) {
        const plan = await this.prisma.pricingPlan.findUnique({
            where: {
                id: dto.pricingPlanId,
            },
        });

        if (!plan) {
            throw new NotFoundException('Pricing plan not found');
        }

        if (plan.status !== 'ACTIVE') {
            throw new BadRequestException(
                'Pricing plan is not active',
            );
        }

        const activePlan = await this.getActiveCustomerPlan(userId);

        /**
         * --------------------------------------------------
         * NORMAL NEW SUBSCRIPTION
         * --------------------------------------------------
         */

        const amount =
            dto.billingCycle === 'MONTHLY'
                ? Number(plan.monthlyPrice)
                : Number(plan.yearlyPrice) * 12;

        /**
         * --------------------------------------------------
         * UPGRADE CALCULATION
         * --------------------------------------------------
         */

        let finalAmount = amount;

        let upgradeDurationDays =
            dto.billingCycle === 'MONTHLY'
                ? 30
                : 365;

        let remainingCredit = 0;

        let extraDays = 0;

        if (
            activePlan &&
            activePlan.pricingPlanId !== plan.id
        ) {
            const upgrade = this.calculateUpgrade(
                activePlan,
                plan,
                dto.billingCycle,
            );

            finalAmount = upgrade.amountToPay;
            upgradeDurationDays =
                upgrade.durationDays;
            remainingCredit =
                upgrade.remainingCredit;
            extraDays =
                upgrade.extraDays;
        }

        /**
         * --------------------------------------------------
         * ZERO PAYMENT UPGRADE
         * --------------------------------------------------
         *
         * Example:
         *
         * Starter yearly remaining credit
         * ₹4761
         *
         * Professional monthly
         * ₹999
         *
         * Payment = ₹0
         *
         * No Razorpay order is required.
         */

        if (finalAmount <= 0) {
            const payment = await this.prisma.payment.create({
                data: {
                    userId,
                    billingCycle: dto.billingCycle,
                    pricingPlanId: plan.id,
                    razorpayOrderId: this.generateRandomCode(10),
                    amount: 0,
                    currency: plan.currency,
                    status: 'CAPTURED',
                    description: `${plan.name} - ${dto.billingCycle} - CREDIT UPGRADE`,
                    durationDays: upgradeDurationDays,
                    upgradeCredit: remainingCredit,
                    isUpgrade: true,
                    capturedAt: new Date(),
                },
            });

            const customerPlan =
                await this.activateCustomerPlan(
                    userId,
                    payment,
                );

            await this.prisma.payment.update({
                where: {
                    id: payment.id,
                },
                data: {
                    customerPlanId: customerPlan.id,
                },
            });

            return {
                requiresPayment: false,
                amount: 0,
                currency: plan.currency,
                plan: customerPlan,
                upgrade: {
                    remainingCredit,
                    amountToPay: 0,
                    durationDays: upgradeDurationDays,
                    extraDays,
                },
            };
        }

        /**
         * --------------------------------------------------
         * RAZORPAY ORDER
         * --------------------------------------------------
         */

        const razorpayOrder =
            await this.razorpayService
                .getClient()
                .orders.create({
                    amount: Math.round(
                        finalAmount * 100,
                    ),
                    currency: plan.currency,
                    receipt:
                        `user_${userId}_plan_${plan.id}_${Date.now()}`,
                    notes: {
                        userId: String(userId),
                        pricingPlanId: String(plan.id),
                        billingCycle:
                            dto.billingCycle,

                        isUpgrade: String(
                            !!activePlan &&
                            activePlan.pricingPlanId !==
                                plan.id,
                        ),

                        durationDays: String(
                            upgradeDurationDays,
                        ),

                        remainingCredit:
                            String(remainingCredit),
                    },
                });

        /**
         * --------------------------------------------------
         * PAYMENT RECORD
         * --------------------------------------------------
         */

        await this.prisma.payment.create({
            data: {
                userId,
                billingCycle: dto.billingCycle,
                pricingPlanId: plan.id,
                razorpayOrderId: razorpayOrder.id,

                amount: finalAmount,

                currency: plan.currency,

                status: 'CREATED',

                description:
                    `${plan.name} - ${dto.billingCycle}`,

                durationDays:
                    upgradeDurationDays,

                upgradeCredit:
                    remainingCredit,

                isUpgrade:
                    !!activePlan &&
                    activePlan.pricingPlanId !==
                        plan.id,
            },
        });

        return {
            requiresPayment: true,
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            keyId: process.env.RAZORPAY_KEY_ID,

            upgrade: {
                remainingCredit,
                amountToPay: finalAmount,
                durationDays: upgradeDurationDays,
                extraDays,
            },
        };
    }

    async verifyPayment(userId: number, dto: VerifyPaymentDto) {
        const payment = await this.prisma.payment.findUnique({
            where: {
                razorpayOrderId: dto.razorpayOrderId,
            },
        });

        if (!payment) {
            throw new NotFoundException('Payment order not found');
        }

        if (payment.userId !== userId) {
            throw new BadRequestException('Invalid payment order');
        }

        if (payment.status === 'CAPTURED' && payment.razorpayPaymentId === dto.razorpayPaymentId) {
            return {
                success: true,
                message: 'Payment already verified',
            };
        }

        const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
            .digest('hex');

        if (generatedSignature !== dto.razorpaySignature) {
            throw new BadRequestException('Invalid payment signature');
        }

        const razorpayPayment = await this.razorpayService.getClient().payments.fetch(dto.razorpayPaymentId);

        if (razorpayPayment.order_id !== dto.razorpayOrderId) {
            throw new BadRequestException('Payment does not belong to this order');
        }

        if (razorpayPayment.status !== 'captured') {
            throw new BadRequestException(`Payment is not captured. Current status: ${razorpayPayment.status}`);
        }

        await this.prisma.payment.update({
            where: {
                id: payment.id,
            },
            data: {
                razorpayPaymentId: dto.razorpayPaymentId,
                status: 'CAPTURED',
                email: razorpayPayment.email,
                vpa: razorpayPayment.vpa,
                rawData: razorpayPayment as any,
                capturedAt: new Date(),
            },
        });

        const customerPlan = await this.activateCustomerPlan(userId, payment);
        
        await this.prisma.payment.update({
            where: {
                id: payment.id,
            },
            data: {
                customerPlanId: customerPlan.id,
            },
        });

        return {
            success: true,
            message: 'Payment verified successfully',
            paymentId: dto.razorpayPaymentId,
            plan: customerPlan,
        };
    }

    private async activateCustomerPlan(
        userId: number,
        payment: any,
    ) {
        const billingCycle =
            payment.billingCycle ??
            (payment.description?.includes('YEARLY')
                ? 'YEARLY'
                : 'MONTHLY');

        let durationDays = Number(payment.durationDays);

        if (!Number.isFinite(durationDays) || durationDays <= 0) {
            durationDays =
                billingCycle === 'MONTHLY'
                    ? 30
                    : 365;
        }

        const now = new Date();

        const existingPlan =
            await this.prisma.customerPlan.findFirst({
                where: {
                    userId,
                    status: CustomerPlanStatus.ACTIVE,
                    endDate: {
                        gt: now,
                    },
                },
                orderBy: {
                    endDate: 'desc',
                },
            });

        const startDate = now;

        const endDate = new Date(
            startDate.getTime() +
                durationDays * 24 * 60 * 60 * 1000,
        );

        return this.prisma.$transaction(async (tx) => {
            /**
             * If this is an upgrade, close the old plan.
             */
            if (
                existingPlan &&
                existingPlan.pricingPlanId !== payment.pricingPlanId
            ) {
                await tx.customerPlan.update({
                    where: {
                        id: existingPlan.id,
                    },
                    data: {
                        status: CustomerPlanStatus.UPGRADED,
                        // Optional:
                        // endDate: now,
                    },
                });
            }

            /**
             * Create the new subscription.
             */
            return tx.customerPlan.create({
                data: {
                    userId,

                    pricingPlanId:
                        payment.pricingPlanId,

                    billingCycle,

                    status:
                        CustomerPlanStatus.ACTIVE,

                    amount:
                        payment.amount,

                    currency:
                        payment.currency,

                    startDate,

                    endDate,
                },
                include: {
                    pricingPlan: true,
                },
            });
        });
    }

    async viewSetting(authUserId: number) {
        const paymentModule = await this.prisma.module.findFirst({
            where: {
                path: '/payments',
            },
        });
        if (!paymentModule) return;

        const viewSetting = await this.prisma.userTableView.findFirst({
            where: {
                userId: authUserId,
                isDefault: true,
                moduleId: paymentModule.id,
            },
            include: {
                columns: true,
            },
        });

        if (!viewSetting) {
            await this.createDefaultPaymentView(authUserId);
            return this.prisma.userTableView.findFirst({
                where: {
                    userId: authUserId,
                    isDefault: true,
                },
                include: {
                    columns: true,
                },
            });
        }
        return viewSetting;
    }

    async createDefaultPaymentView(userId: number) {
        const paymentModule = await this.prisma.module.findUnique({
            where: {
                path: '/payments',
            },
        });

        if (!paymentModule) return;
        await this.prisma.userTableView.create({
            data: {
                userId: userId,
                moduleId: paymentModule.id,
                name: 'Default',
                isDefault: true,
                columns: {
                    create: [
                        { field: 'id', label: 'ID', visible: true, order: 1 },
                        { field: 'razorpayOrderId', label: 'Razorpay Order ID', visible: true, order: 2 },
                        { field: 'razorpayPaymentId', label: 'Razorpay Payment ID', visible: true, order: 3, },
                        { field: 'amount', label: 'Amount', visible: true, order: 4 },
                        { field: 'currency', label: 'Currency', visible: true, order: 5 },
                        { field: 'method', label: 'Method', visible: true, order: 6 },
                        { field: 'email', label: 'Email', visible: true, order: 7 },
                        { field: 'contact', label: 'Contact', visible: true, order: 8 },
                        { field: 'pricingPlan', label: 'Pricing Plan', visible: true, order: 9 },
                        { field: 'pricingPlanId', label: 'Pricing Plan ID', visible: true, order: 10 },
                        { field: 'userId', label: 'Created By ID', visible: true, order: 11 },
                        { field: 'user', label: 'Created By', visible: false, order: 12 },
                        { field: 'cardLast4', label: 'Card Last 4', visible: false, order: 13 },
                        { field: 'cardNetwork', label: 'Card Network', visible: false, order: 14 },
                        { field: 'cardType', label: 'Card Type', visible: false, order: 15 },
                        { field: 'description', label: 'Description', visible: false, order: 16 },
                        { field: 'errorCode', label: 'Error Code', visible: false, order: 17 },
                        { field: 'errorDescription', label: 'Error Description', visible: false, order: 18 },
                        { field: 'errorSource', label: 'Error Source', visible: false, order: 19 },
                        { field: 'errorStep', label: 'Error Step', visible: false, order: 20 },
                        { field: 'errorReason', label: 'Error Reason', visible: false, order: 21 },
                        { field: 'createdAt', label: 'Created At', visible: true, order: 22, },
                        { field: 'updatedAt', label: 'Updated At', visible: false, order: 23, },
                        { field: 'status', label: 'Status', visible: true, order: 24 },
                        { field: 'action', label: 'Action', visible: true, order: 25 },
                    ],
                },
            },
        });
    }

    async updateSetting(dto: UpdateViewSettingDto) {
        const updatedColumns = await this.prisma.$transaction(
            dto.columns.map((column) =>
                this.prisma.tableColumn.update({
                    where: {
                        id: column.id,
                    },
                    data: {
                        visible: column.visible,
                        ...(column.order !== undefined ? { order: column.order } : {}),
                    },
                }),
            ),
        );
    
        return updatedColumns;
    }

    async get(id: number, authUserId: number) {
        return this.prisma.payment.findUnique({
            where: {
                id,
            },
            include: {
                user: true,
                pricingPlan: true,
            },
        });
    }

    async handleRazorpayWebhook(payload: any, signature: string) {
        if (!signature) {
            throw new BadRequestException('Razorpay webhook signature is missing');
        }

        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!webhookSecret) {
            throw new BadRequestException('Razorpay webhook secret is not configured');
        }

        const rawBody = JSON.stringify(payload);
        const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

        if (!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))) {
            throw new BadRequestException('Invalid Razorpay webhook signature');
        }

        const event = payload?.event;

        switch (event) {
            case 'payment.captured':
                return this.handlePaymentCapturedWebhook(payload);

            case 'payment.failed':
                return this.handlePaymentFailedWebhook(payload);

            case 'order.paid':
                return this.handleOrderPaidWebhook(payload);

            default:
                return {
                    success: true,
                    message: `Webhook event ${event} ignored`,
                };
        }
    }

    private async handlePaymentCapturedWebhook(payload: any) {
        const paymentEntity = payload?.payload?.payment?.entity;

        if (!paymentEntity) {
            throw new BadRequestException('Invalid payment.captured payload');
        }

        const razorpayPaymentId = paymentEntity.id;
        const razorpayOrderId = paymentEntity.order_id;

        if (!razorpayOrderId) {
            throw new BadRequestException('Razorpay order ID missing from webhook');
        }

        const payment = await this.prisma.payment.findUnique({
            where: {
                razorpayOrderId,
            },
        });

        if (!payment) {
            throw new NotFoundException(`Payment order ${razorpayOrderId} not found`);
        }

        if (payment.status === 'CAPTURED' && payment.razorpayPaymentId === razorpayPaymentId) {
            return {
                success: true,
                message: 'Payment already processed',
            };
        }

        const updatedPayment = await this.prisma.payment.update({
            where: {
                id: payment.id,
            },
            data: {
                razorpayPaymentId,
                status: 'CAPTURED',
                email: paymentEntity.email ?? null,
                vpa: paymentEntity.vpa ?? null,
                contact: paymentEntity.contact ?? null,
                method: this.mapPaymentMethod(paymentEntity.method),
                rawData: paymentEntity,
                capturedAt: new Date(),
            },
        });

        const customerPlan = await this.activateCustomerPlan(payment.userId, payment);

        await this.prisma.payment.update({
            where: {
                id: payment.id,
            },
            data: {
                customerPlanId: customerPlan.id,
            },
        });

        return {
            success: true,
            message: 'Payment captured and customer plan activated',
            paymentId: razorpayPaymentId,
            customerPlanId: customerPlan.id,
        };
    }

    private async handlePaymentFailedWebhook(payload: any) {
        const paymentEntity =
            payload?.payload?.payment?.entity;

        if (!paymentEntity) {
            throw new BadRequestException(
                'Invalid payment.failed payload',
            );
        }

        const razorpayPaymentId = paymentEntity.id;
        const razorpayOrderId = paymentEntity.order_id;

        if (!razorpayOrderId) {
            throw new BadRequestException(
                'Razorpay order ID missing from webhook',
            );
        }

        const payment = await this.prisma.payment.findUnique({
            where: {
                razorpayOrderId,
            },
        });

        if (!payment) {
            throw new NotFoundException(
                `Payment order ${razorpayOrderId} not found`,
            );
        }

        const updatedPayment =
            await this.prisma.payment.update({
                where: {
                    id: payment.id,
                },
                data: {
                    razorpayPaymentId,
                    status: 'FAILED',
                    email: paymentEntity.email ?? null,
                    vpa: paymentEntity.vpa ?? null,
                    contact: paymentEntity.contact ?? null,
                    method: this.mapPaymentMethod(paymentEntity.method),
                    errorCode: paymentEntity.error_code ?? null,
                    errorDescription: paymentEntity.error_description ?? null,
                    errorSource: paymentEntity.error_source ?? null,
                    errorStep: paymentEntity.error_step ?? null,
                    errorReason: paymentEntity.error_reason ?? null,
                    rawData: paymentEntity,
                },
            });

        return {
            success: true,
            message: 'Payment failure recorded',
            paymentId: razorpayPaymentId,
        };
    }

    private async handleOrderPaidWebhook(payload: any) {
        const orderEntity = payload?.payload?.order?.entity;

        if (!orderEntity) {
            throw new BadRequestException('Invalid order.paid payload');
        }

        const razorpayOrderId = orderEntity.id;

        const payment = await this.prisma.payment.findUnique({
            where: {
                razorpayOrderId,
            },
        });

        if (!payment) {
            throw new NotFoundException(`Payment order ${razorpayOrderId} not found`);
        }

        return {
            success: true,
            message: 'Order paid webhook received',
            orderId: razorpayOrderId,
        };
    }
    private mapPaymentMethod(method?: string | null): PaymentMethod | null {
        if (!method) return null;

        const mapping: Record<string, PaymentMethod> = {
            card: PaymentMethod.CARD,
            upi: PaymentMethod.UPI,
            netbanking: PaymentMethod.NETBANKING,
            wallet: PaymentMethod.WALLET,
            emi: PaymentMethod.EMI,
        };

        return mapping[method.toLowerCase()] ?? null;
    }

    // async getActiveCustomerPlan(userId: number) {
    //     const accessibleUserIds = await this.userPolicy.getAccessibleUserIds(userId);

    //     return this.prisma.customerPlan.findFirst({
    //         where: {
    //             userId: {
    //                 in: accessibleUserIds
    //             },
    //             status: CustomerPlanStatus.ACTIVE,
    //             startDate: { lte: new Date() },
    //             endDate: {
    //                 gt: new Date(),
    //             },
    //         },
    //         include: {
    //             pricingPlan: {
    //                 include: {
    //                     planModules: {
    //                         where: {
    //                             enabled: true,
    //                         },
    //                         select: {
    //                             moduleId: true,
    //                             enabled: true,
    //                             limit: true,
    //                             displayValue: true,
    //                             featureLabel: true,
    //                             featureDescription: true,
    //                             actions: true,
    //                             sortOrder: true,
    //                         },
    //                             orderBy: {
    //                                 sortOrder: 'asc',
    //                             },
    //                     },
    //                 },
    //             },
    //         },
    //         orderBy: {
    //         endDate: 'desc',
    //         },
    //     });
    // }
    async getActiveCustomerPlan(userId: number) {
        const cacheKey = `customer-plan:active:${userId}`;

        // Check Redis first
        // const cachedPlan = await this.redisService.get<ActiveCustomerPlan>(cacheKey);

        // if (cachedPlan) {
        //     return cachedPlan;
        // }

        // Get accessible users
        const accessibleUserIds =
            await this.userPolicy.getAccessibleUserIds(userId);

        // Query database
        const plan = await this.prisma.customerPlan.findFirst({
            where: {
                userId: {
                    in: accessibleUserIds,
                },
                status: CustomerPlanStatus.ACTIVE,
                startDate: {
                    lte: new Date(),
                },
                endDate: {
                    gt: new Date(),
                },
            },

            include: {
                pricingPlan: {
                    include: {
                        planModules: {
                            where: {
                                enabled: true,
                            },
                            select: {
                                moduleId: true,
                                enabled: true,
                                limit: true,
                                displayValue: true,
                                featureLabel: true,
                                featureDescription: true,
                                actions: true,
                                sortOrder: true,
                            },
                            orderBy: {
                                sortOrder: 'asc',
                            },
                        },
                    },
                },
            },

            orderBy: {
                endDate: 'desc',
            },
        });

        // Cache the result
        if (plan) {
            const now = Date.now();
            const expiry = new Date(plan.endDate).getTime();

            const remainingSeconds = Math.floor(
                (expiry - now) / 1000,
            );

            if (remainingSeconds > 0) {
                await this.redisService.set(
                    cacheKey,
                    plan,
                    Math.min(remainingSeconds, 300),
                );
            }
        }

        return plan;
    }

    getRemainingBalance(activePlan: any): number {
        if (!activePlan?.startDate || !activePlan?.endDate) {
            return 0;
        }

        const start = new Date(activePlan.startDate).getTime();
        const end = new Date(activePlan.endDate).getTime();
        const now = Date.now();

        if (
            !Number.isFinite(start) ||
            !Number.isFinite(end) ||
            end <= start ||
            now >= end
        ) {
            return 0;
        }

        const totalDuration = end - start;
        const remainingDuration = Math.max(end - now, 0);
        const currentPlanAmount = Number(activePlan.amount ?? 0);

        if (
            totalDuration <= 0 ||
            remainingDuration <= 0 ||
            currentPlanAmount <= 0
        ) {
            return 0;
        }

        return currentPlanAmount * (remainingDuration / totalDuration);
    }

    private calculateUpgrade(
        activePlan: any,
        targetPlan: any,
        billingCycle: 'MONTHLY' | 'YEARLY',
    ) {
        const remainingCredit = this.getRemainingBalance(activePlan);

        const targetPrice =
            billingCycle === 'MONTHLY'
                ? Number(targetPlan.monthlyPrice)
                : Number(targetPlan.yearlyPrice) * 12;

        const baseDurationDays =
            billingCycle === 'MONTHLY'
                ? 30
                : 365;

        /**
         * Daily price of the target plan
         */
        const targetDailyPrice =
            targetPrice / baseDurationDays;

        let amountToPay = 0;
        let durationDays = baseDurationDays;

        /**
         * --------------------------------------------------
         * CASE 1
         * Remaining credit is LESS than target price
         * --------------------------------------------------
         *
         * Example:
         *
         * Remaining credit = ₹500
         * Professional monthly = ₹999
         *
         * Pay = ₹499
         * Duration = 30 days
         */
        if (remainingCredit < targetPrice) {
            amountToPay =
                targetPrice - remainingCredit;

            durationDays =
                baseDurationDays;
        }

        /**
         * --------------------------------------------------
         * CASE 2
         * Remaining credit is EQUAL to target price
         * --------------------------------------------------
         *
         * Example:
         *
         * Remaining credit = ₹999
         * Professional monthly = ₹999
         *
         * Pay = ₹0
         * Duration = 30 days
         */
        else if (remainingCredit === targetPrice) {
            amountToPay = 0;
            durationDays = baseDurationDays;
        }

        /**
         * --------------------------------------------------
         * CASE 3
         * Remaining credit is GREATER than target price
         * --------------------------------------------------
         *
         * Example:
         *
         * Remaining credit = ₹4761
         * Professional monthly = ₹999
         *
         * Daily price = ₹999 / 30
         *
         * Duration =
         * ₹4761 / ₹33.30
         * = ~143 days
         *
         * Payment = ₹0
         */
        else {
            amountToPay = 0;

            durationDays =
                remainingCredit / targetDailyPrice;
        }

        return {
            remainingCredit,
            amountToPay: Number(amountToPay.toFixed(2)),
            durationDays: Math.floor(durationDays),
            extraDays: 0,
        };
    }

    async getFreePlan() {
        return await this.prisma.pricingPlan.findFirst({
            where: {
                slug: 'free',
                status: PricingPlanStatus.ACTIVE,
            },
            include: {
                planModules: {
                    where: {
                        enabled: true,
                    },
                    include: {
                        module: true,
                    },
                    orderBy: {
                        sortOrder: 'asc',
                    },
                },
            },
        });
    }

    async getActiveOrFreePlan (authUserId: number): Promise<any> {
        const activePlan = await this.getActiveCustomerPlan(authUserId);
        if (activePlan) {
            return {
                isActive: true,
                activePlan
            }
        } else {
            return {
                isActive: false,
                activePlan: await this.getFreePlan()
            }
        }
    }

    async isAllowedModules (authUserId: number, CheckModuleId: number) {
        const plan = await this.getActiveOrFreePlan(authUserId);

        if (plan.isActive) {
            const isAllow = plan?.activePlan?.pricingPlan?.planModules.some((planModule) => {
                if (planModule.moduleId === CheckModuleId) {
                    return true;
                }
            });

            return isAllow
        } else {
            const isAllow = plan?.activePlan?.planModules.some((planModule) => {
                if (planModule.moduleId === CheckModuleId) {
                    return true;
                }
            });


            return isAllow
        }
    }
}
