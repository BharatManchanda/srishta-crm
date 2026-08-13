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
            "r_ads_reporting",
            "r_marketing_leadgen_automation",
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
            where: { userId },
        });

        if (!linkedinAccount) {
            throw new NotFoundException("LinkedIn account not connected");
        }

        const owner = `urn:li:sponsoredAccount:${adAccountId}`;
        const url = `https://api.linkedin.com/rest/leadForms` +
            `?owner=(sponsoredAccount:${encodeURIComponent(owner)})` +
            `&q=owner` +
            `&count=${limit}` +
            `&start=${start}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${linkedinAccount.accessToken}`,
                "LinkedIn-Version": "202604",
                "X-Restli-Protocol-Version": "2.0.0",
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new BadRequestException(data);
        }

        return data;
    }

    async getLinkedinLeadFormFields(formId: string, userId: number) {
        const linkedinAccount = await this.prisma.linkedinAccount.findFirst({
            where: {
                userId,
            },
        });

        if (!linkedinAccount) {
            throw new NotFoundException("LinkedIn account not connected");
        }

        const url = `https://api.linkedin.com/rest/leadForms/${formId}`;

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${linkedinAccount.accessToken}`,
                "LinkedIn-Version": "202604",
                "X-Restli-Protocol-Version": "2.0.0",
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new BadRequestException(data);
        }

        return data;
    }

    async handleLeadCreated(notification: any) {
        const leadResponseUrn = notification?.leadGenFormResponse;

        if (!leadResponseUrn) {
            throw new Error('LinkedIn leadGenFormResponse is missing');
        }

        const sponsoredAccountUrn = notification?.owner?.sponsoredAccount;

        if (!sponsoredAccountUrn) {
            throw new Error('LinkedIn sponsoredAccount is missing');
        }

        const sponsoredAccountId = sponsoredAccountUrn.split(':').pop();

        if (!sponsoredAccountId) {
            throw new Error('Unable to extract sponsored account ID');
        }

        const linkedinAdAccount = await this.prisma.linkedinAdAccount.findFirst({
            where: {
                accountId: sponsoredAccountId,
            },
            include: {
                linkedinAccount: true,
            },
        });

        if (!linkedinAdAccount) {
            throw new Error(`LinkedIn ad account ${sponsoredAccountId} is not connected`);
        }

        const linkedinAccount = linkedinAdAccount.linkedinAccount;

        const leadResponseId = leadResponseUrn.split(':').pop();

        if (!leadResponseId) {
            throw new Error('Unable to extract LinkedIn lead response ID');
        }

        const leadResponse = await this.getLinkedinLeadFormResponse(leadResponseId, linkedinAccount.accessToken);

        console.log('LinkedIn Lead Response:', JSON.stringify(leadResponse, null, 2));

        const chain = await this.prisma.leadSyncChain.findFirst({
            where: {
                provider: 'LINKEDIN_ADS',
                createdById: linkedinAccount.userId,
                linkedinAdsAccId: sponsoredAccountId,
                status: 'ACTIVE',
            },
            include: {
                mappings: true,
            },
        });

        if (!chain) {
            throw new Error(`No active LinkedIn sync chain found for ad account ${sponsoredAccountId}`);
        }

        console.log('LinkedIn Sync Chain:', JSON.stringify(chain, null, 2));

        const leadData = this.mapLinkedinLeadToCRM(leadResponse, chain.mappings);
        console.log('Mapped CRM Lead:', JSON.stringify(leadData, null, 2));

        const crmLead = await this.prisma.lead.create({
            data: {
                ...leadData,
                createdById: linkedinAccount.userId,
                source: 'LINKEDIN',
            },
        });

        return crmLead;
    }

    async getLinkedinLeadFormResponse(leadResponseId: string, accessToken: string) {
        const version = process.env.LINKEDIN_API_VERSION;

        if (!version) {
            throw new Error('LINKEDIN_API_VERSION is not configured');
        }

        const response = await fetch(`https://api.linkedin.com/rest/leadFormResponses/${encodeURIComponent(leadResponseId)}`, {
            method: 'GET',

            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Linkedin-Version': version,
                'X-Restli-Protocol-Version': '2.0.0',
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('LinkedIn lead response error:', response.status, error);
            throw new Error(`LinkedIn API error: ${response.status} - ${error}`);
        }

        return response.json();
    }

    mapLinkedinLeadToCRM(
        leadResponse: any,
        mappings: any[],
    ) {
        const result: Record<string, any> = {};
        const answers = leadResponse?.formResponse?.answers ?? [];

        for (const mapping of mappings) {
            const crmField = mapping.crmField;
            const linkedinField = mapping.facebookField;
            const answer = answers.find((item: any) => String(item.questionId) === String(linkedinField));

            if (!answer) {
                continue;
            }
            result[crmField] = this.extractLinkedinAnswer(answer);
        }

        return result;
    }

    extractLinkedinAnswer(answer: any) {
    if (answer == null) {
        return null;
    }

    if (typeof answer.answer === 'string') {
        return answer.answer;
    }

    if (answer.accepted?.answer !== undefined) {
        return answer.accepted.answer;
    }

    if (answer.accepted?.value !== undefined) {
        return answer.accepted.value;
    }

    if (Array.isArray(answer.answer)) {
        return answer.answer.join(', ');
    }

    return null;
}
}
