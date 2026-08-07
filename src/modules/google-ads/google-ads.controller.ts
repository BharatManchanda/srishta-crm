import { Body, Controller, Delete, ForbiddenException, Get, Param, ParseIntPipe, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { GoogleAdsService } from './google-ads.service';
import type { Response } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { GoogleAdsPolicy } from './google-ads.policy';

@Controller('google-ads')
export class GoogleAdsController {
    constructor(
        private readonly googleAdsService: GoogleAdsService,
        private readonly googleAdsPolicy: GoogleAdsPolicy,
    ) { }

    @UseGuards(AuthGuard)
    @Get('auth')
    async auth(@Req() req: Request) {
        const currentUser = req['user'];
        await this.googleAdsPolicy.authorizeGoogleAds(currentUser);
        const url = this.googleAdsService.generateAuthUrl(currentUser.id);
        return { url };
    }

    @UseGuards(AuthGuard)
    @Get()
    async get(@Req() req: Request) {
        const currentUser = req['user'];
        await this.googleAdsPolicy.authorizeGoogleAds(currentUser);
        return await this.googleAdsService.get(currentUser.id);
    }

    @UseGuards(AuthGuard)
    @Get("customer")
    async getCustomer(@Req() req: Request) {
        const currentUser = req['user'];
        await this.googleAdsPolicy.authorizeGoogleAds(currentUser);
        const connection = await this.googleAdsService.get(currentUser.id);

        if (!connection) {
            throw new ForbiddenException("Google Ads connection not found");
        }

        const accessToken = await this.googleAdsService.getValidAccessToken(connection);

        return this.googleAdsService.getCustomers(accessToken);
    }

    @UseGuards(AuthGuard)
    @Get(":customerId/lead-forms")
    async getCustomerLeadForm(@Param('customerId') customerId: string, @Req() req: Request) {
        const currentUser = req['user'];
        await this.googleAdsPolicy.authorizeGoogleAds(currentUser);
        const connection = await this.googleAdsService.get(currentUser.id);
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
        const currentUser = req['user'];
        await this.googleAdsPolicy.authorizeGoogleAds(currentUser);
        return this.googleAdsService.disconnect(currentUser.id);
    }

    @Post("webhook/:userId")
    async webhook(@Param('userId', ParseIntPipe) userId: number, @Body() dto: any) {
        return this.googleAdsService.webhook(dto, userId);
    }
}
