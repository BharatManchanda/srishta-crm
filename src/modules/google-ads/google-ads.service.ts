import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { google } from 'googleapis';
import { GoogleAdsApi } from "google-ads-api";
import { GoogleAdsConnection, LeadPriority, LeadRating, LeadSource, LeadStatus } from '@prisma/client';
import { LeadCreateDto } from '../lead/dto/lead-create.dto';
import { LeadService } from '../lead/lead.service';

@Injectable()
export class GoogleAdsService {
    private oauthClient;

    constructor(
        private prisma: PrismaService,
        private leadService: LeadService
    ) {
        this.oauthClient = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_ADS_REDIRECT_URI
        );
    }

    generateAuthUrl(userId: number) {
        return this.oauthClient.generateAuthUrl({
            access_type:'offline',
            prompt:'consent',
            scope:[
                'https://www.googleapis.com/auth/adwords',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile'
            ],
            state: userId.toString(),
        });
    }

    public async getCustomers(accessToken: string) {
        const response = await fetch("https://googleads.googleapis.com/v22/customers:listAccessibleCustomers", {
            method:"GET",
            headers:{
                Authorization:`Bearer ${accessToken}`,
                "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
            }
        });

        const data = await response.json();
        if (data.statusCode) {
            throw new ForbiddenException(data.message)
        }
        if (!data.resourceNames?.length) {
            throw new ForbiddenException("No Google Ads customer account found");
        }

        return data.resourceNames.map((item: string) => item.replace("customers/",""));
    }

    private async getCustomerId(accessToken: string) {
        const response = await fetch("https://googleads.googleapis.com/v22/customers:listAccessibleCustomers", {
            method:"GET",
            headers:{
                Authorization:`Bearer ${accessToken}`,
                "developer-token":
                    process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
            }
        });

        const data = await response.json();
        if (!data.resourceNames?.length) {
            throw new ForbiddenException("No Google Ads customer account found");
        }

        return data.resourceNames[0].replace("customers/","");
    }

    async get(userId: number) {
        return await this.prisma.googleAdsConnection.findFirst({
            where: {
                userId
            }
        });
    }

    async getValidAccessToken(connection:any){
        const now = new Date();

        if(connection.expiresAt && connection.expiresAt > now) {
            return connection.accessToken;
        }

        return await this.refreshGoogleAdsToken(connection);
    }

    async refreshGoogleAdsToken(connection: GoogleAdsConnection) {
        this.oauthClient.setCredentials({ refresh_token: connection.refreshToken });
        const { credentials } = await this.oauthClient.refreshAccessToken();

        await this.prisma.googleAdsConnection.update({
            where:{
                id: connection.id
            },
            data:{
                accessToken: credentials.access_token!,
                expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null
            }
        });

        return credentials.access_token;
    }

    async handleCallback(code: string, userId: number){
        const { tokens } = await this.oauthClient.getToken(code);
        this.oauthClient.setCredentials(tokens);

        const oauth2 = google.oauth2({
            auth:this.oauthClient,
            version:'v2'
        });

        const userInfo = await oauth2.userinfo.get();
        const email = userInfo.data.email;
        const googleUserId = userInfo.data.id;
        const customerId = await this.getCustomerId(tokens.access_token);

        if (!email || !googleUserId) {
            throw new Error('Invalid Google Ads Credentials');
        }

        return await this.prisma.googleAdsConnection.create({
            data:{
                userId,
                googleUserId: googleUserId ?? "",
                email: email ?? "",
                customerId,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null
            }
        });
    }

    async disconnect(userId: number) {
        const connection = await this.prisma.googleAdsConnection.findFirst({
            where: {
                userId,
            },
        });

        if (!connection) {
            throw new NotFoundException("Google Ads connection not found");
        }

        return await this.prisma.googleAdsConnection.delete({
            where: {
                id: connection.id,
            },
        });
    }

    async getLeads(connection:any){

        const accessToken = connection.accessToken;
        const token = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

        if(!token){
            throw new Error("GOOGLE_ADS_DEVELOPER_TOKEN is missing");
        }

        const response = await fetch(`https://googleads.googleapis.com/v22/customers/${connection.customerId}/googleAds:search`, {
            method:"POST",
            headers:{
                Authorization:`Bearer ${accessToken}`,
                "developer-token": token,
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                query:`
                    SELECT
                        campaign.id,
                        campaign.name,
                        campaign.status
                    FROM campaign
                    LIMIT 10
                `
            })
        });

        const data = await response.json();
        console.log(JSON.stringify(data,null,2));

        if(!response.ok){
            throw new Error(JSON.stringify(data));
        }

        return data.results;
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

    async webhook(dto: any, userId: number) {
        const leadSyncChain = await this.prisma.leadSyncChain.findFirst({
            where: {
                provider: "GOOGLE_ADS",
                createdById: userId
            },
            include: {
                mappings: true
            }
        })
        
        if (!leadSyncChain) {
            throw new BadRequestException("Lead sync page not connected");
        }

        const googleFields = dto.user_column_data.reduce((acc, item) => {
            acc[item.column_id] = item.string_value;
            return acc;
        }, {} as Record<string, string>);

        const leadData: Record<string, any> = {};

        for (const mapping of leadSyncChain.mappings) {
            const value = googleFields[mapping.facebookField];
            leadData[mapping.crmField] = value;
        }

        const leadDto: LeadCreateDto = {
            name: leadData.name || null,
            title: leadData.title || null,
            email: leadData.email || null,
            phone: leadData.phone || null,
            website: leadData.website || null,
            city: leadData.city || null,
            address: leadData.address || null,
            state: leadData.state || null,
            pinCode: leadData.pinCode || null,
            country: leadData.country || null,
            industry: leadData.industry || null,
            budget: leadData.budget ? Number(leadData.budget) : 0,
            requirement: leadData.requirement || null,
            source: this.getEnumValue(leadData.source, LeadSource, LeadSource.FACEBOOK),
            status: this.getEnumValue(leadData.status, LeadStatus, LeadStatus.NEW),
            priority: this.getEnumValue(leadData.priority, LeadPriority, LeadPriority.MEDIUM),
            rating: this.getEnumValue(leadData.rating, LeadRating, LeadRating.COLD),
            leadScore: leadData.leadScore ?? 0,
            isQualified: leadData.isQualified ?? false,
            isConverted: leadData.isConverted ?? false,
            nextFollowUpDate: undefined,
            lastFollowUpDate: undefined,
            description: "Created from Facebook Lead Ads",
        };
        
        await this.leadService.create(leadDto, userId);
        
        return true
    }

    async getLeadForms(customerId: string, accessToken: string) {
        const API_VERSION = 'v25';
        const url = `https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:search`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
            Authorization: `Bearer ${accessToken}`,
            "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
            "login-customer-id": process.env.MANAGER_CUSTOMER_ID || customerId,
            "Content-Type": "application/json"
            },
            body: JSON.stringify({
                query: `
                    SELECT
                    asset.id, asset.name, asset.lead_form_asset.business_name
                    FROM asset
                    WHERE asset.type='LEAD_FORM'
                `
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Google Ads API Error:", data.error);
            throw new Error(data.error.message);
        }

        return data.results ?? [];
    }

    async getCampaigns(customerId: string, accessToken: string) {
        const response = await fetch(`https://googleads.googleapis.com/v25/customers/${customerId}/googleAds:search`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
                "login-customer-id": process.env.MANAGER_CUSTOMER_ID || customerId,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: `
                    SELECT ad_group_criterion.keyword.text, ad_group_criterion.status FROM ad_group_criterion WHERE ad_group_criterion.type = 'KEYWORD' AND ad_group_criterion.status = 'ENABLED'
                `,
            }),
            }
        );

        const data = await response.json();

        console.log(JSON.stringify(data, null, 2));

        return data.results ?? [];
    }
}
