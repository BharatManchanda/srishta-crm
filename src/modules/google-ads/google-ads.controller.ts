import { Body, Controller, Delete, ForbiddenException, Get, Param, ParseIntPipe, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { GoogleAdsService } from './google-ads.service';
import type { Response } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('google-ads')
export class GoogleAdsController {
    constructor(
        private readonly googleAdsService: GoogleAdsService
    ) { }

    @UseGuards(AuthGuard)
    @Get('auth')
    async auth(@Req() req: Request) {
        const userId = req['user'].id;
        const url = this.googleAdsService.generateAuthUrl(userId);
        return { url };
    }

    @UseGuards(AuthGuard)
    @Get()
    async get(@Req() req: Request) {
        const authUserId = req['user'].id;
        return await this.googleAdsService.get(authUserId);
    }

    @UseGuards(AuthGuard)
    @Get("customer")
    async getCustomer(@Req() req: Request) {
        const authUserId = req['user'].id;
        const connection = await this.googleAdsService.get(authUserId);
        if (!connection) {
            throw new ForbiddenException("Google Ads connection not found");
        }
        const accessToken = await this.googleAdsService.getValidAccessToken(connection);
        return await this.googleAdsService.getCustomers(accessToken);
    }

    @UseGuards(AuthGuard)
    @Get(":customerId/lead-forms")
    async getCustomerLeadForm(@Param('customerId') customerId: string, @Req() req: Request) {
        const authUserId = req['user'].id;
        const connection = await this.googleAdsService.get(authUserId);
        if (!connection) {
            throw new ForbiddenException("Google Ads connection not found");
        }
        
        return await this.googleAdsService.getCampaigns(customerId, connection.accessToken);
    }

    @Get('callback')
    async callback(@Query('code') code:string, @Res() res:Response, @Query('state') state: string) {
        const authUserId = parseInt(state, 10);
        await this.googleAdsService.handleCallback(code, authUserId);
        return res.redirect(`${process.env.FRONTEND_URL}/connects`);
    }

    @UseGuards(AuthGuard)
    @Delete()
    async disconnect(@Req() req: Request) {
        const authUserId = req['user'].id
        return this.googleAdsService.disconnect(authUserId);
    }

    @Post("webhook/:userId")
    async webhook(@Param('userId', ParseIntPipe) userId: number, @Body() dto: any) {
        return this.googleAdsService.webhook(dto, userId);
    }
}
