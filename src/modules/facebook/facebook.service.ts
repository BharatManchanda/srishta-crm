import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeadPriority, LeadRating, LeadSource, LeadStatus, LeadSyncStatus } from '@prisma/client';
import { LeadService } from '../lead/lead.service';
import { LeadCreateDto } from '../lead/dto/lead-create.dto';

@Injectable()
export class FacebookService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly leadService: LeadService,
    ) {}

    async get(userId: number) {
        return this.prisma.facebookAccount.findFirst({
            where: {
                userId: userId
            }
        })
    }

    private async getAccessToken(code: string) {
        const url = `https://graph.facebook.com/v23.0/oauth/access_token` +
            `?client_id=${process.env.META_APP_ID}` +
            `&client_secret=${process.env.META_APP_SECRET}` +
            `&redirect_uri=${process.env.META_FACEBOOK_REDIRECT_URI}` +
            `&code=${code}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new BadRequestException(await response.text());
        }

        return response.json();
    }

    private async getFacebookUser(accessToken:string){
        const response = await fetch(`https://graph.facebook.com/v23.0/me?fields=id,name&access_token=${accessToken}`);
        if(!response.ok){
            throw new BadRequestException(await response.text());
        }
        return response.json();
    }


    private async getPages(accessToken:string){
        const response = await fetch(`https://graph.facebook.com/v23.0/me/accounts?access_token=${accessToken}`);
        if(!response.ok){
            throw new BadRequestException(await response.text());
        }
        const data = await response.json();
        return data.data;
    }
    
    public async getAdAccounts(accessToken:string){
        const response = await fetch(`https://graph.facebook.com/v24.0/me/adaccounts?access_token=${accessToken}&fields=id,account_id,name`);
        if(!response.ok){
            throw new BadRequestException(await response.text());
        }
        const data = await response.json();
        return data.data;
    }

    async callback(userId:number, code:string) {
        const token:any = await this.getAccessToken(code);
        const userAccessToken = token.access_token;
        const fbUser = await this.getFacebookUser(userAccessToken);
        const pages = await this.getPages(userAccessToken);

        const facebookAccount = await this.prisma.facebookAccount.create({
            data:{
                userId: userId,
                facebookUserId: fbUser.id,
                facebookName: fbUser.name,
                accessToken: userAccessToken,
                pages:{
                    create: pages.map(page => ({
                        facebookPageId: page.id,
                        name: page.name,
                        pageAccessToken: page.access_token
                    }))
                }
            }
        });
        return facebookAccount;
    }

    async getAccountPages(facebookAccountId) {
        return this.prisma.facebookPage.findMany({
            where: {
                facebookAccountId: facebookAccountId
            }
        })
    }

    async getLeadgenForms(pageId: number, userId: number) {
        const page = await this.prisma.facebookPage.findFirst({
            where: {
                id: pageId,
                facebookAccount: {
                    userId: userId
                }
            }
        });
        if (!page) {
            throw new BadRequestException("Page not found");
        }

        const response = await fetch(`https://graph.facebook.com/v24.0/${page.facebookPageId}/leadgen_forms?access_token=${page.pageAccessToken}&fields=questions,name,status,locale`);

        if(!response.ok){
            throw new BadRequestException(await response.text());
        }
        const data = await response.json();
        return data.data;
    }

    async handleLeadgen(data: any) {
        const leadgen_id = data.value.leadgen_id
        const page_id = data.value.page_id

        const page = await this.prisma.facebookPage.findFirst({
            where: {
                facebookPageId: page_id,
            },
            include: {
                facebookAccount: true,
            },
        })
        
        if (!page) {
            throw new BadRequestException("Facebook Page not connected");
        }

        const response = await fetch(`https://graph.facebook.com/v26.0/${leadgen_id}?access_token=${page.pageAccessToken}&fields=field_data`);
        const leadData = await response.json();

        const fields = leadData.field_data.reduce((acc, item) => {
            acc[item.name] = item.values[0];
            return acc;
        }, {});

        if (!response.ok) {
            throw new BadRequestException("Unable to fetch Facebook lead");
        }

        const leadSyncChain = await this.prisma.leadSyncChain.findFirst({
            where: {
                createdById: page.facebookAccount.userId,
                facebookAccountId: page.facebookAccount.id,
                facebookPageId: page.id.toString(),
                facebookAdAccountId: data.value.ad_id.toString(),
                status: LeadSyncStatus.ACTIVE,
                facebookFormId: data.value.form_id
            },
            include: {
                mappings: true
            }
        })

        if (!leadSyncChain) {
            throw new BadRequestException("Lead sync chain not found");
        }

        const leadFields: Record<string, any> = {};

        leadSyncChain.mappings.forEach((mapping) => {
            leadFields[mapping.crmField] =
                fields[mapping.facebookField];
        });


        const leadDto: LeadCreateDto = {
            name: leadFields.name || null,
            title: leadFields.title || null,
            email: leadFields.email || null,
            phone: leadFields.phone || null,
            website: leadFields.website || null,
            city: leadFields.city || null,
            address: leadFields.address || null,
            state: leadFields.state || null,
            pinCode: leadFields.pinCode || null,
            country: leadFields.country || null,
            industry: leadFields.industry || null,
            budget: leadFields.budget ? Number(leadFields.budget) : 0,
            requirement: leadFields.requirement || null,
            source: this.getEnumValue(leadFields.source, LeadSource, LeadSource.FACEBOOK),
            status: this.getEnumValue(leadFields.status, LeadStatus, LeadStatus.NEW),
            priority: this.getEnumValue(leadFields.priority, LeadPriority, LeadPriority.MEDIUM),
            rating: this.getEnumValue(leadFields.rating, LeadRating, LeadRating.COLD),
            leadScore: leadFields.leadScore ?? 0,
            isQualified: leadFields.isQualified ?? false,
            isConverted: leadFields.isConverted ?? false,
            nextFollowUpDate: undefined,
            lastFollowUpDate: undefined,
            description: "Created from Facebook Lead Ads",
        };

        return this.leadService.create(leadDto, page.facebookAccount.userId);
    }

    private getEnumValue<T extends string>(
        value: string | undefined | null,
        enumObject: Record<string, T>,
        defaultValue: T
    ): T {
        if (!value) {
            return defaultValue;
        }

        const values = Object.values(enumObject);
        return values.includes(value as T) ? value as T : defaultValue;
    }
}
