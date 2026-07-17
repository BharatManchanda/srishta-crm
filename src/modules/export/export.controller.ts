import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ExportService } from './export.service';
import { ExportDto } from './dto/export.dto';
import type { Response, Request } from 'express';

@UseGuards(AuthGuard)
@Controller('export')
export class ExportController {
    constructor(
        private readonly exportService: ExportService,
    ) {}

    @Post()
    async export(@Body() dto: ExportDto, @Req() req: Request, @Res() res: Response) {
        const authUserId = req['user'].id;
        const csv = await this.exportService.export(dto, authUserId);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="export-${Date.now()}.csv"`);

        return res.send(csv);
    }
}
