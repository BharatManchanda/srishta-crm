import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { AskAiDto } from './dto/ask-ai.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('ai')
export class AiController {
    constructor(
        private ai: AiService,
    ) {}

    @Post("ask")
    ask(@Body() dto: AskAiDto) {
        return this.ai.ask(dto.question);
    }
}
