import { Body, Controller, ForbiddenException, Get, Param, ParseIntPipe, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { Response } from 'express';

@Controller('facebook')
export class FacebookController {
    constructor(private readonly facebookService: FacebookService) { }

    @UseGuards(AuthGuard)
    @Get()
    async get(@Req() req: Request) {
        const userId = req['user'].id;
        const account = await this.facebookService.get(userId);
        return account;
    }

    @UseGuards(AuthGuard)
    @Get("auth")
    connect(@Req() req: Request) {
        const userId = req['user'].id;
        const url = `https://www.facebook.com/v23.0/dialog/oauth` +
            `?client_id=${process.env.META_APP_ID}` +
            `&redirect_uri=${process.env.META_FACEBOOK_REDIRECT_URI}` +
            `&scope=pages_manage_ads,pages_manage_metadata,pages_read_engagement,pages_read_user_content,read_insights,pages_manage_posts,pages_manage_engagement,leads_retrieval,business_management,ads_read,ads_management` +
            `&response_type=code` +
            `&state=${userId.toString()}`;
        return { url };
    }

    @Get("callback")
    async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
        try {
            console.log("Facebook OAuth callback hit with code:", code, "state/userId:", state);
            const userId = parseInt(state, 10);
            await this.facebookService.callback(userId, code);
            console.log("WhatsApp successfully connected for user:", userId);
            return res.redirect(`${process.env.FRONTEND_URL}/connects`);
        } catch (error) {
            console.error("Error in WhatsApp callback:", error);
            // Even if it fails, redirect to connects page so frontend knows to reload
            return res.redirect(`${process.env.FRONTEND_URL}/connects?error=true`);
        }
    }

    @UseGuards(AuthGuard)
    @Get("ad-accounts")
    async getAdAccounts(@Req() req: Request) {
        const userId = req['user'].id;
        const account = await this.facebookService.get(userId);
        if (!account) {
            throw new ForbiddenException("Account not found");
        }
        return await this.facebookService.getAdAccounts(account.accessToken);
    }

    @UseGuards(AuthGuard)
    @Get("pages/:facebookAccountId")
    async pages(@Param('facebookAccountId', ParseIntPipe) facebookAccountId: number,) {
        return await this.facebookService.getAccountPages(facebookAccountId);
    }

    @UseGuards(AuthGuard)
    @Get("leadgen-forms/:pageId")
    async getLeadgenForms(@Param('pageId', ParseIntPipe) pageId: number, @Req() req: Request) {
        const userId = req['user'].id;
        return await this.facebookService.getLeadgenForms(pageId, userId);
    }

    @Get("webhook")
    verifyWebhook(
        @Query('hub.mode') mode: string,
        @Query('hub.verify_token') token: string,
        @Query('hub.challenge') challenge: string,
    ) {
        const VERIFY_TOKEN = process.env.META_FACEBOOK_VERIFY_TOKEN;

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log("Facebook webhook verified");
            return challenge;
        }

        throw new ForbiddenException("Webhook verification failed");
    }

    @Post("webhook")
    async webhook(@Body() body: any) {
        const data = body?.["entry"]?.[0]?.["changes"]?.[0]
        switch (data.field) {
            case "leadgen":
                return await this.facebookService.handleLeadgen(data);
        }
        return true
    }
}
