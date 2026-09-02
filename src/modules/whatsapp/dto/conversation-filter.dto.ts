// whatsapp-conversation-filter.dto.ts

import { IsOptional, IsInt, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';

export class WhatsappConversationFilterDto extends PaginationDto {
    @IsOptional()
    search?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    connectionId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    contactId?: number;

}