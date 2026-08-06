import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
type LinkedinLeadForm = {
    id: string;
    name?: string;
    campaignId: string | number;
    questions: any[];
};
@Injectable()
export class LinkedinAdsService {

    private clientId = process.env.LINKEDIN_CLIENT_ID;
    private clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    private redirectUri = process.env.LINKEDIN_REDIRECT_URI;

    constructor(
        private readonly prisma: PrismaService,
    ) { }
    async generateAuthUrl(userId:number) {
        const state = Buffer.from(JSON.stringify({ userId })).toString("base64");
        const scopes = [ "openid", "profile", "email", "r_ads", "rw_ads",
            // "r_marketing_leadgen_automation"
            // "r_ads_reporting",
            // "r_leadgen_forms"
         ].join(" ");

        return (`https://www.linkedin.com/oauth/v2/authorization?`+
            `response_type=code`+
            `&client_id=${this.clientId}`+
            `&redirect_uri=${this.redirectUri}`+
            `&state=${state}`+
            `&scope=${encodeURIComponent(scopes)}`
        );
    }

    async callback(code: string, state: string) {
        const decodedState = JSON.parse(
            Buffer.from(state, "base64").toString("utf-8")
        );
        const userId = decodedState.userId;

        if (!this.clientId || !this.clientSecret || !this.redirectUri) {
            throw new Error("LinkedIn OAuth credentials are missing");
        }

        const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code,
                client_id: this.clientId,
                client_secret: this.clientSecret,
                redirect_uri: this.redirectUri,
            }),
        });

        const tokenData = await tokenResponse.json();
        const { access_token, expires_in, refresh_token } = tokenData;

        const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        const linkedinUser = await profileResponse.json();
        const linkedinAccount = await this.prisma.linkedinAccount.upsert({
            where: {
                userId: userId
            },
            update: {
                linkedinUserId: linkedinUser.sub,
                name: linkedinUser.name,
                accessToken: access_token,
                refreshToken: refresh_token ?? null,
                expiresAt: new Date(Date.now() + expires_in * 1000),
            },
            create: {
                userId,
                linkedinUserId: linkedinUser.sub,
                name: linkedinUser.name,
                accessToken: access_token,
                refreshToken: refresh_token ?? null,
                expiresAt: new Date(Date.now() + expires_in * 1000),
            },
        });

        return linkedinAccount;
    }

    async get(code: string, userId: number) {
        return await this.prisma.linkedinAccount.findFirst({
            where: {
                userId
            }
        });
    }

    async disconnect(id: number, userId: number) {
        const linkedinAccount = await this.prisma.linkedinAccount.findUnique({
            where: {
                userId,
                id
            },
            select: { id: true }
        });

        if (!linkedinAccount) {
            throw new NotFoundException("LinkedIn account not connected");
        }

        await this.prisma.linkedinAdAccount.deleteMany({
            where: {
                linkedinAccountId: linkedinAccount.id
            }
        });

        return await this.prisma.linkedinAccount.delete({
            where: { id: linkedinAccount.id }
        });
    }

    async getAdAccounts(userId: number) {
        const linkedinAccount = await this.prisma.linkedinAccount.findFirst({
            where: {
                userId
            }
        });

        if (!linkedinAccount) {
            throw new NotFoundException("LinkedIn account not connected");
        }

       const response = await fetch("https://api.linkedin.com/rest/adAccounts?q=search", {
            headers: {
            Authorization: `Bearer ${linkedinAccount.accessToken}`,
                "LinkedIn-Version": "202604",
                "X-Restli-Protocol-Version": "2.0.0",
            },
        });

        const data = await response.json();
        return data;
    }

    async getLinkedinLeadForms(adAccountId: string, userId: number, limit = 50, start = 0) {
        const linkedinAccount = await this.prisma.linkedinAccount.findFirst({
            where: {
                userId
            }
        });

        if (!linkedinAccount) {
            throw new NotFoundException("LinkedIn account not connected");
        }

        const owner = `urn:li:sponsoredAccount:${adAccountId}`;

        const params = new URLSearchParams({
            q: "owner",
            owner,
            count: String(limit),
            start: String(start),
        });

        const response = await fetch(`https://api.linkedin.com/rest/leadGenForms?${params.toString()}`, {
            headers: {
                Authorization: `Bearer ${linkedinAccount.accessToken}`,
                "LinkedIn-Version": "202512",
                "X-Restli-Protocol-Version": "2.0.0",
            }
        });

        const data = await response.json();
        if (!response.ok) {
            throw new BadRequestException(data);
        }

        return data;
    }

    async webhook(dto: any) {
        console.log(dto);
        return true;
    }
}
