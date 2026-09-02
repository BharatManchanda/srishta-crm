import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { WhatsappEntityType } from '@prisma/client';
import { WhatsappConversationFilterDto } from './dto/conversation-filter.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';

@Injectable()
export class WhatsappService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly paginationService: PaginationService,
    ) { }

    async get(authUserId: number) {
        let whatsapp = await this.prisma.whatsappConnection.findFirst({
            where: {
                connectedById: authUserId,
            },
            include: {
                phones: true,
            }
        });

        return whatsapp;
    }

    async connect(userId: number, code: string) {
        const token = await this.getAccessToken(code);
        const me = await this.graph("/me", token.access_token);
        const businesses = await this.graph("/me/businesses", token.access_token);

        if (!businesses.data.length) {
            throw new BadRequestException("No Meta Business Account found.");
        }

        const businessId = businesses.data[0].id;
        const wabas = await this.graph(`/${businessId}/owned_whatsapp_business_accounts`, token.access_token);

        if (!wabas.data.length) {
            throw new BadRequestException("No WhatsApp Business Account found.");
        }

        const wabaId = wabas.data[0].id;

        const phones = await this.graph(`/${wabaId}/phone_numbers`, token.access_token);

        // 6. Save Connection
        const connection = await this.prisma.whatsappConnection.upsert({
            where: {
                connectedById: userId,
            },
            update: {
                accessToken: token.access_token,
                businessId,
                wabaId,
                metaUserId: me.id,
            },
            create: {
                connectedById: userId,
                accessToken: token.access_token,
                businessId,
                wabaId,
                metaUserId: me.id,
            },
        });

        for (const phone of phones.data) {
            await this.prisma.whatsappPhone.upsert({
                where: {
                    phoneNumberId: phone.id,
                },
                update: {
                    displayPhoneNumber: phone.display_phone_number,
                    verifiedName: phone.verified_name,
                    connectionId: connection.id,
                },
                create: {
                    connectionId: connection.id,
                    phoneNumberId: phone.id,
                    displayPhoneNumber: phone.display_phone_number,
                    verifiedName: phone.verified_name,
                },
            });
        }

        return connection;
    }

    private async getAccessToken(code: string) {
        const url = `https://graph.facebook.com/v23.0/oauth/access_token` +
            `?client_id=${process.env.META_APP_ID}` +
            `&client_secret=${process.env.META_APP_SECRET}` +
            `&redirect_uri=${process.env.META_REDIRECT_URI}` +
            `&code=${code}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new BadRequestException(await response.text());
        }

        return response.json();
    }

    private async graph(path: string, accessToken: string) {
        const response = await fetch(`https://graph.facebook.com/v23.0${path}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new BadRequestException(await response.text());
        }

        return response.json();
    }

    async sendMessage(dto: SendMessageDto, userId: number) {
        const connection = await this.prisma.whatsappConnection.findUnique({
            where: {
                connectedById: userId,
            },
            include: {
                phones: true,
            },
        });

        if (!connection) {
            return true
            throw new BadRequestException("WhatsApp is not connected.");
        }

        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? ""

        const contact = await this.prisma.whatsappContact.upsert({
            where: {
                connectionId_waId: {
                    connectionId: connection.id,
                    waId: dto.to,
                },
            },
            update: {},
            create: {
                connectionId: connection.id,
                waId: dto.to,
                phoneNumber: dto.to,
            },
        });

        const existingLink = await this.prisma.whatsappContactLink.findFirst({
            where: {
                whatsappContactId: contact.id,
                entityType: dto.entityType,
                entityId: dto.entityId,
            },
        });

        if (!existingLink) {
            await this.prisma.whatsappContactLink.create({
                data: {
                    whatsappContactId: contact.id,
                    entityType: dto.entityType,
                    entityId: dto.entityId,
                },
            });
        }

        const conversation = await this.prisma.whatsappConversation.upsert({
            where: {
                connectionId_contactId: {
                    connectionId: connection.id,
                    contactId: contact.id,
                },
            },
            update: {
                lastMessageAt: new Date(),
            },
            create: {
                connectionId: connection.id,
                contactId: contact.id,
                lastMessageAt: new Date(),
            }
        });

        const response = await fetch(`https://graph.facebook.com/v25.0/${phoneNumberId}/messages`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${connection.accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: dto.to,
                    type: "text",
                    text: {
                        preview_url: false,
                        body: dto.message,
                    },
                }),
            }
        );

        const result = await response.json();
        if (result.error) {
            return true;
            throw new BadRequestException(result.error.message);
        }

        const message = await this.prisma.whatsappMessage.create({
            data: {
                conversationId: conversation.id,
                whatsappMessageId: result.messages?.[0]?.id ?? crypto.randomUUID(),
                direction: "OUTBOUND",
                type: "TEXT",
                from: phoneNumberId,
                to: dto.to,
                body: dto.message,
                status: response.ok ? "SENT" : "FAILED",
                timestamp: new Date(),
                rawPayload: result,
            },
        });

        await this.prisma.whatsappConversation.update({
            where:{
                id: conversation.id,
            },
            data:{
                lastMessageAt: new Date(),
            },
        });
        return {
            success: true,
            message,
            whatsappResponse: result,
        };
    }

    async getMessageList(entityType: WhatsappEntityType, entityId: number, userId: number) {
        const contactLink = await this.prisma.whatsappContactLink.findFirst({
            where: {
                entityType,
                entityId,
            },
            include: {
                whatsappContact: true,
            },
        });


        if (!contactLink) {
            throw new NotFoundException("WhatsApp contact not found");
        }

        const conversation = await this.prisma.whatsappConversation.findUnique({
            where: {
                connectionId_contactId: {
                    connectionId:
                        contactLink.whatsappContact.connectionId,

                    contactId:
                        contactLink.whatsappContactId,
                },
            },
            include: {
                messages: {
                    orderBy: {
                        timestamp: "asc",
                    },
                },
            },
        });

        if (!conversation) {
            return [];
        }

        return conversation.messages.map((msg) => ({
            id: msg.id,
            text: msg.body,
            sender: msg.direction === "OUTBOUND" ? "me" : "customer",
            type: msg.type,
            status: msg.status,
            time: msg.timestamp,
        }));
    }

    async getOwnWhatasappBusinessAccount(userId: number) {

        const connection = await this.prisma.whatsappConnection.findUnique({
            where: { connectedById: userId },
        });

        if (!connection) {
            return true
            throw new BadRequestException("WhatsApp is not connected.");
        }

        const response = await this.graph(`/${connection.businessId}/owned_whatsapp_business_accounts`, connection.accessToken);
        return response;
    }

    async handleIncomingMessage(payload: any) {
        const value = payload.entry?.[0]?.changes?.[0]?.value;
        if (!value?.messages) {
            return;
        }

        const phoneNumberId = value.metadata.phone_number_id;
        // 123456123
        const connection = await this.prisma.whatsappConnection.findFirst({
            where:{
                phones:{
                    some:{
                        phoneNumberId
                    }
                }
            }
        });

        if(!connection) {
            throw new ForbiddenException("WhatsApp connection not found");
        }

        for(const msg of value.messages){
            const contactData = value.contacts?.[0];
            const waId = msg.from;

            const contact = await this.prisma.whatsappContact.upsert({
                where:{
                    connectionId_waId:{
                        connectionId:connection.id,
                        waId
                    }
                },
                update:{
                    profileName: contactData?.profile?.name
                },
                create:{
                    connectionId:connection.id,
                    waId,
                    phoneNumber:waId,
                    profileName:
                    contactData?.profile?.name
                }
            });

            const conversation = await this.prisma.whatsappConversation.upsert({
                where:{
                    connectionId_contactId: {
                        connectionId: connection.id,
                        contactId: contact.id
                    }
                },
                update:{
                    lastMessageAt: new Date(Number(msg.timestamp) * 1000)
                },
                create:{
                    connectionId: connection.id,
                    contactId: contact.id,
                    lastMessageAt: new Date(Number(msg.timestamp) * 1000)
                }
            });

            await this.prisma.whatsappMessage.create({
                data: {
                    conversationId: conversation.id,
                    whatsappMessageId: msg.id,
                    direction: "INBOUND",
                    type: this.mapMessageType(msg.type),
                    from: msg.from,
                    to: phoneNumberId,
                    body: msg.text?.body ?? null,
                    timestamp: new Date(Number(msg.timestamp) * 1000),
                    status: "DELIVERED",
                    rawPayload: msg
                }
            });
        }
    }

    mapMessageType(type: string) {
        const map = {
            text:"TEXT",
            image:"IMAGE",
            video:"VIDEO",
            audio:"AUDIO",
            document:"DOCUMENT",
            sticker:"STICKER",
            location:"LOCATION",
            contacts:"CONTACT",
            template:"TEMPLATE"

        };
        return map[type] ?? "TEXT";
    }

    async getConversationList(dto: WhatsappConversationFilterDto, currentUserId: number) {
        const orderBy = dto.sortBy ? { [dto.sortBy]: dto.sortOrder || 'desc' } : { lastMessageAt: 'desc' };
        const result = await this.paginationService.paginate(this.prisma.whatsappConversation, {
            page: dto.page,
            perPage: dto.perPage,
            where: {
                ...(dto.connectionId && {
                    connectionId: dto.connectionId,
                }),

                ...(dto.contactId && {
                    contactId: dto.contactId,
                }),

                ...(dto.search && {
                    contact: {
                        OR: [
                            {
                                phoneNumber: {
                                    contains: dto.search,
                                    mode: 'insensitive',
                                },
                            },
                            {
                                profileName: {
                                    contains: dto.search,
                                    mode: 'insensitive',
                                },
                            },
                        ],
                    },
                }),
            },
            orderBy,
            include: {
                contact: {
                    select: {
                        id: true,
                        waId: true,
                        phoneNumber: true,
                        profileName: true,
                        links: {
                            take: 1,
                            select: {
                                entityId: true,
                                entityType: true,
                            },
                        },
                    },
                },
                connection: {
                    select: {
                        id: true,
                        businessId: true,
                        wabaId: true,
                    },
                },
                messages: {
                    take: 1,
                    orderBy: {
                        timestamp: 'desc',
                    },
                    select: {
                        id: true,
                        body: true,
                        type: true,
                        direction: true,
                        status: true,
                        timestamp: true,
                    },
                },
                _count: {
                    select: {
                        messages: {
                            where: {
                                direction: "OUTBOUND",
                                status: {
                                    not: "READ",
                                },
                            },
                        },
                    },
                },
            },
        });
        return result;
    }
}