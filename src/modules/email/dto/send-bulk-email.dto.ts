import { IsEnum, IsArray, IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class SendBulkEmailDto {
  @IsEnum(['LEAD', 'CONTACT', 'ACCOUNT'])
  entityType: 'LEAD' | 'CONTACT' | 'ACCOUNT';

  @IsArray()
  @IsNumber({}, { each: true })
  entityIds: number[];

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
