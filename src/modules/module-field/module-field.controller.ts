import { Body, Controller, Get, Param, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ModuleFieldService } from './module-field.service';
import { ModuleFieldFilterDto } from './dto/module-field-filter.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('module-field')
export class ModuleFieldController {
    constructor(
        private readonly moduleFieldService: ModuleFieldService
    ) {}

    @Get()
    async getList(@Query() dto: ModuleFieldFilterDto, @Req() req: Request) {
        const authUserId = req['user'].id;
        return this.moduleFieldService.getList(dto, authUserId);
    }

    @Put(":moduleId")
    async update(@Body() dto: any, @Param('moduleId') moduleId: number, @Req() req: Request){
        const authUserId = req['user'].id;
        return await this.moduleFieldService.update(dto, moduleId, authUserId);
    }
}
