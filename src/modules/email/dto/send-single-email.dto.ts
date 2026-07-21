import { IsEnum, IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class SendSingleEmailDto {
  @IsEnum(['LEAD', 'CONTACT', 'ACCOUNT'])
  entityType: 'LEAD' | 'CONTACT' | 'ACCOUNT';

  @IsNumber()
  entityId: number;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
