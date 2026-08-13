import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { LinkedinAdsService } from './linkedin-ads.service';
import type { Response } from 'express';
import { LinkedinAdsPolicy } from './linkedin-ads.policy';
import * as crypto from 'crypto';

@Controller('linkedin-ads')
export class LinkedinAdsController {

    constructor(
        private readonly linkedinAdsService: LinkedinAdsService,
        private readonly linkedinAdsPolicy: LinkedinAdsPolicy
    ) { }

    @UseGuards(AuthGuard)
    @Get('auth')
    async auth(@Req() req: Request) {
        const currentUser = req['user'];
        await this.linkedinAdsPolicy.authorizeLinkedinAds(currentUser);
        const url = await this.linkedinAdsService.generateAuthUrl(currentUser.id);
        return { url };
    }
    
    @Get("callback")
    async callback(
        @Query("code") code: string,
        @Query("state") state: string,
        @Res() res:Response
    ) {
        await this.linkedinAdsService.callback(code, state);
        return res.redirect(`${process.env.FRONTEND_URL}/connects`);
    }

    @UseGuards(AuthGuard)
    @Get()
    async get(@Query("code") code:string, @Req() req) {
        const currentUser = req['user'];
        await this.linkedinAdsPolicy.authorizeLinkedinAds(currentUser);
        return this.linkedinAdsService.get(code, currentUser.id);
    }

    @UseGuards(AuthGuard)
    @Delete(":id")
    async disconnect(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
        const currentUser = req['user'];
        await this.linkedinAdsPolicy.authorizeLinkedinAds(currentUser);
        return this.linkedinAdsService.disconnect(id, currentUser.id);
    }

    @UseGuards(AuthGuard)
    @Get("ad-accounts")
    async getAdAccounts(@Req() req: Request) {
        const currentUser = req['user'];
        await this.linkedinAdsPolicy.authorizeLinkedinAds(currentUser);
        return await this.linkedinAdsService.getAdAccounts(currentUser.id);
    }

    @UseGuards(AuthGuard)
    @Get("/:adAccountId/get-lead-form")
    async getLeadForms(@Req() req: Request, @Param('adAccountId') adAccountId: string) {
        const currentUser = req['user'];
        await this.linkedinAdsPolicy.authorizeLinkedinAds(currentUser);
        return await this.linkedinAdsService.getLinkedinLeadForms(adAccountId, currentUser.id);
    }

    // @UseGuards(AuthGuard)
    // @Post('webhook')
    // async receiveWebhook(@Body() body: any) {
    //     console.log('LinkedIn webhook:', body);

    //     return {
    //     success: true,
    //     };
    // }

    // @Get('webhook')
    // async validateWebhook(@Query('challengeCode') challengeCode: string) {
    //     const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    //     console.log(challengeCode,":::challengeCode")
    //     if (!challengeCode) {
    //         return {
    //             error: 'challengeCode is required',
    //         };
    //     }

    //     if (!clientSecret) {
    //         throw new Error('LINKEDIN_CLIENT_SECRET is not configured');
    //     }

    //     const challengeResponse = crypto
    //         .createHmac('sha256', clientSecret)
    //         .update(challengeCode, 'utf8')
    //         .digest('hex');

    //     return {
    //         challengeCode,
    //         challengeResponse,
    //     };
    // }

    @UseGuards(AuthGuard)
    @Get("/:formId/lead-form-fields")
    async linkedinLeadFormFields(@Req() req: Request, @Param('formId') formId: string) {
        return await this.linkedinAdsService.getLinkedinLeadFormFields(formId, req['user'].id);
    }


    @Post('webhook')
    async receiveWebhook(@Body() body: any) {
        console.log('LinkedIn webhook:', JSON.stringify(body, null, 2));

        // Ignore anything other than lead notifications
        if (body?.type !== 'LEAD_ACTION') {
            return { success: true };
        }

        // Handle deleted lead
        if (body.leadAction === 'DELETED') {
            // await this.linkedinAdsService.handleLeadDeleted(body);

            return { success: true };
        }

        // Handle created lead
        if (body.leadAction === 'CREATED') {
            await this.linkedinAdsService.handleLeadCreated(body);
            return { success: true };
        }

        return {
            success: true,
        };
    }

    @Get('webhook')
    async validateWebhook(
        @Query('challengeCode') challengeCode: string,
    ) {
        const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

        console.log('challengeCode:', challengeCode);

        if (!challengeCode) {
            return {
                error: 'challengeCode is required',
            };
        }

        if (!clientSecret) {
            throw new Error('LINKEDIN_CLIENT_SECRET is not configured');
        }

        const challengeResponse = crypto
            .createHmac('sha256', clientSecret)
            .update(challengeCode, 'utf8')
            .digest('hex');

        return {
            challengeCode,
            challengeResponse,
        };
    }
}
