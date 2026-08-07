import { Body, Controller, ForbiddenException, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WhatsappService } from './whatsapp.service';
import type { Response } from 'express';
import { SendMessageDto } from './dto/send-message.dto';
import { WhatsappEntityType } from '@prisma/client';
import { WhatsappConversationFilterDto } from './dto/conversation-filter.dto';
import { WhatsappPolicy } from './whatsapp.policy';

@Controller('whatsapp')
export class WhatsappController {

    constructor(
        private readonly whatsappService: WhatsappService,
        private readonly whatsappPolicy: WhatsappPolicy,
    ) { }

    @UseGuards(AuthGuard)
    @Get()
    async get(@Req() req: Request) {
        const currentUser = req['user'];
        await this.whatsappPolicy.authorizeWhatsapp(currentUser);
        const account = await this.whatsappService.get(currentUser.id);
        return account;
    }

    @UseGuards(AuthGuard)
    @Get("auth")
    async connect(@Req() req: Request) {
        const currentUser = req['user'];
        await this.whatsappPolicy.authorizeWhatsapp(currentUser);
        const url = `https://www.facebook.com/v23.0/dialog/oauth` +
            `?client_id=${process.env.META_APP_ID}` +
            `&redirect_uri=${process.env.META_REDIRECT_URI}` +
            `&scope=whatsapp_business_management,business_management,whatsapp_business_messaging` +
            `&response_type=code` +
            `&state=${currentUser.id.toString()}`;
        return { url };
    }

    @Get("webhook")
    verifyWebhook(
        @Query("hub.mode") mode: string,
        @Query("hub.verify_token") token: string,
        @Query("hub.challenge") challenge: string,
    ) {

        const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

        if (mode === "subscribe" && token === VERIFY_TOKEN) {
            return challenge;
        }

        throw new ForbiddenException();
    }

    @Post("webhook")
    async receiveWebhook(
        @Body() payload: any
    ) {
        await this.whatsappService.handleIncomingMessage(payload);

        return {
            success: true
        };
    }

    @Get("callback")
    async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
        try {
            console.log("WhatsApp OAuth callback hit with code:", code, "state/userId:", state);
            const userId = parseInt(state, 10);
            await this.whatsappService.connect(userId, code);
            console.log("WhatsApp successfully connected for user:", userId);
            return res.redirect(`${process.env.FRONTEND_URL}/connects`);
        } catch (error) {
            console.error("Error in WhatsApp callback:", error);
            return res.redirect(`${process.env.FRONTEND_URL}/connects?error=true`);
        }
    }

    @UseGuards(AuthGuard)
    @Get("get-message")
    async getMessages(
        @Query("entityType") entityType: WhatsappEntityType,
        @Query("entityId") entityId: number,
        @Req() req,
    ) {
        const currentUser = req['user'];
        await this.whatsappPolicy.authorizeWhatsapp(currentUser);
        return this.whatsappService.getMessageList(entityType, Number(entityId), currentUser.id);
    }

    @UseGuards(AuthGuard)
    @Post("send-message")
    async sendMessage(@Req() req: Request, @Body() dto: SendMessageDto) {
        const currentUser = req['user'];
        await this.whatsappPolicy.authorizeWhatsapp(currentUser);
        return await this.whatsappService.sendMessage(dto, currentUser.id);
    }

    @Get("get-own-whatasapp-business-account")
    async getOwnWhatasappBusinessAccount(@Req() req: Request) {
        const currentUser = req['user'];
        await this.whatsappPolicy.authorizeWhatsapp(currentUser);
        return await this.whatsappService.getOwnWhatasappBusinessAccount(currentUser.id);
    }

    @UseGuards(AuthGuard)
    @Get("get-conversation")
    async getConversationList(@Query() dto: WhatsappConversationFilterDto, @Req() req: Request) {
        const currentUser = req['user'];
        await this.whatsappPolicy.authorizeWhatsapp(currentUser);
        return await this.whatsappService.getConversationList(dto, currentUser.id);
    }
}
