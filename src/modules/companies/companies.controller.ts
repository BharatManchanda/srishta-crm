import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesFilterDto } from './dto/companies-filter.dto';

@Controller('companies')
export class CompaniesController {
    constructor(
        private readonly companiesService: CompaniesService,
    ) { }

    @Get()
    async getList(@Query() dto: CompaniesFilterDto, @Req() req: Request) {
        const authUser = req['user'];
        return this.companiesService.getList(dto);
    }

    @Get(":id")
    async getOne(@Param('id') id: number) {
        return this.companiesService.getOne(id);
    }
}
