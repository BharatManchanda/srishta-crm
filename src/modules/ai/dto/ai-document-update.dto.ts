import { AiEntityType } from "@prisma/client";
import { IsEnum, IsNumber, IsString } from "class-validator";

export class AiDocumentUpdateDto {
    @IsEnum(AiEntityType)
    entityType: AiEntityType;
    
    @IsNumber()
    entityId: number;
    
    @IsString()
    title: string;

    @IsString()
    content: string;
}