import { WhatsappEntityType } from "@prisma/client";
import { IsEnum, IsNumber, IsPhoneNumber, IsString } from "class-validator"

export class SendMessageDto {
    @IsString()
    message: string;

    // @IsString()
    // to: string;

    @IsEnum(WhatsappEntityType)
    entityType: WhatsappEntityType;

    @IsNumber()
    entityId: number;

    @IsPhoneNumber()
    to: string;
}