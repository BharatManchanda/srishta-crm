import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { LinkedinAdsService } from './linkedin-ads.service';
import type { Response } from 'express';

@Controller('linkedin-ads')
export class LinkedinAdsController {

    constructor(
        private readonly linkedinAdsService: LinkedinAdsService
    ) { }

    @UseGuards(AuthGuard)
    @Get('auth')
    async auth(@Req() req: Request) {
        const userId = req['user'].id;
        const url = await this.linkedinAdsService.generateAuthUrl(userId);
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
        const userId = req['user'].id;
        return this.linkedinAdsService.get(code, userId);
    }

    @UseGuards(AuthGuard)
    @Delete(":id")
    async disconnect(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
        const userId = req['user'].id;
        return this.linkedinAdsService.disconnect(id, userId);
    }

    @UseGuards(AuthGuard)
    @Get("ad-accounts")
    async getAdAccounts(@Req() req: Request) {
        const userId = req['user'].id;
        return await this.linkedinAdsService.getAdAccounts(userId);
    }

    @UseGuards(AuthGuard)
    @Get("/:adAccountId/get-lead-form")
    async getLeadForms(@Req() req: Request, @Param('adAccountId') adAccountId: string) {
        const userId = req['user'].id;
        return await this.linkedinAdsService.getLinkedinLeadForms(adAccountId, userId);
    }

    @UseGuards(AuthGuard)
    @Post("/webhook")
    async webhook(@Body() dto: any) {
        return await this.linkedinAdsService.webhook(dto);
    }
}
