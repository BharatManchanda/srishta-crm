import { Body, Controller, Get, Headers, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { PaymentFilterDto } from './dto/payment-filter.dto';
import { PaymentPolicy } from './payments.policy';
import { UpdateViewSettingDto } from './dto/update-view-setting.dto';

@Controller('payments')
export class PaymentsController {
    constructor(
        private readonly paymentsService: PaymentsService,
        private readonly paymentPolicy: PaymentPolicy,
    ) {}

    @UseGuards(AuthGuard)
    @Get()
    async getList(@Query() dto: PaymentFilterDto, @Req() req: Request) {
        await this.paymentPolicy.authorize(req['user'], 'viewAll');
        const currentUser = req['user'];
        return this.paymentsService.getList(dto, currentUser);
    }

    @UseGuards(AuthGuard)
    @Get('active-plan')
    async getActiveCustomerPlan(@Req() req: Request) {
        const authUserId = req['user'].id;
        return await this.paymentsService.getActiveCustomerPlan(authUserId);
    }

    @UseGuards(AuthGuard)
    @Post('create-order')
    createOrder(@Req() req, @Body() dto: CreateOrderDto) {
        return this.paymentsService.createOrder(req.user.id, dto);
    }
    @UseGuards(AuthGuard)
    @Post('verify-payment')
    verifyPayment(@Req() req: any, @Body() dto: VerifyPaymentDto) {
        return true;
        // return this.paymentsService.verifyPayment(req.user.id, dto);
    }

    @UseGuards(AuthGuard)
    @Get('view-setting')
    async viewSetting(@Req() req: Request) {
        const authUserId = req['user'].id;
        return this.paymentsService.viewSetting(authUserId);
    }

    @UseGuards(AuthGuard)
    @Put('update-setting')
    async updateSetting(@Body() dto: UpdateViewSettingDto, @Req() req: Request) {
        return this.paymentsService.updateSetting(dto);
    }

    @UseGuards(AuthGuard)
    @Get(":id")
    async get(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
        await this.paymentPolicy.authorize(req['user'], 'view', id);
        const authUserId = req['user'].id;
        return this.paymentsService.get(id, authUserId);
    }

    @Post('webhook')
    async razorpayWebhook(
        @Headers('x-razorpay-signature') signature: string,
        @Body() body: any,
        @Req() req: Request,
    ) {
        console.log(body, signature);
        return this.paymentsService.handleRazorpayWebhook(body, signature);
    }
}
