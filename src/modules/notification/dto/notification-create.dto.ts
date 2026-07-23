import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { NotificationType } from "@prisma/client";

export class CreateNotificationDto {
    @IsString()
    title: string;

    @IsString()
    message: string;

    @IsEnum(NotificationType)
    type: NotificationType;

    @IsString()
    @IsOptional()
    module?: string;

    @IsNumber()
    @IsOptional()
    entityId?: number;

    @IsNumber()
    createdBy?: number;

    @IsNumber()
    userIds: number[];
}