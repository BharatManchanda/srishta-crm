import { OtpPurpose } from "@prisma/client";
import { IsEmail, IsEnum } from "class-validator";

export class SendOtpDto {
    @IsEmail()
    email: string;

    @IsEnum(OtpPurpose)
    purpose: OtpPurpose;
}