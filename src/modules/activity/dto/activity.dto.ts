import { ActivityEntity } from "@prisma/client";
import { IsEnum, IsNumber, IsString } from "class-validator";

export class CreateActivityDto {

    @IsEnum(ActivityEntity)
    entityType: ActivityEntity;

    @IsNumber()
    entityId: number;

    @IsString()
    action: string;

    @IsString()
    description: string;

    metadata?: Record<string, any>;
}