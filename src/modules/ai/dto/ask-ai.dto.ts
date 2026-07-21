import { IsString } from 'class-validator';

export class AskAiDto {
    @IsString()
    question: string;

}