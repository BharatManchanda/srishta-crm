import { BlogStatus, BookDemoStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBookDemoDto {
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	name: string;

	@IsEmail()
	@IsNotEmpty()
	@MaxLength(255)
	email: string;

	@IsString()
	@IsNotEmpty()
	@MaxLength(20)
	phone: string;

	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	company: string;

	@IsString()
	@IsNotEmpty()
	@MaxLength(50)
	teamSize: string;

	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	industry: string;

	@IsString()
	@IsOptional()
	@MaxLength(2000)
	message?: string;

	@IsOptional()
	@IsEnum(BookDemoStatus)
	status: BookDemoStatus;
}