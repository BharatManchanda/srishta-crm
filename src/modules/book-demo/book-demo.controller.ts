import { Body, Controller, Delete, ForbiddenException, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { BookDemoService } from './book-demo.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UserType } from '@prisma/client';
import { BookDemoFilterDto } from './dto/book-demo-filter.dto';
import { CreateBookDemoDto } from './dto/book-demo-create.dto';
import { UpdateBookDemoDto } from './dto/book-demo-update.dto';
import { UpdateViewSettingDto } from './dto/update-view-setting.dto';

@Controller('book-demo')
export class BookDemoController {
    constructor(
        private readonly bookDemoService: BookDemoService,
    ) {}

    @UseGuards(AuthGuard)
    @Get()
    async getList(@Query() dto: BookDemoFilterDto, @Req() req: Request) {
        const currentUser = req['user'];
        if (currentUser.userType !== UserType.ADMIN) {
            throw new ForbiddenException('User not authenticated');
        }
        return this.bookDemoService.getList(dto, currentUser);
    }

    @Post()
    async create(@Body() dto: CreateBookDemoDto, @Req() req: Request) {
        return this.bookDemoService.create(dto);
    }

    @UseGuards(AuthGuard)
    @Put(":id")
    async update(@Body() dto: UpdateBookDemoDto, @Req() req: Request, @Param('id', ParseIntPipe) id: number) {
        return this.bookDemoService.update(dto, id);
    }

    @UseGuards(AuthGuard)
    @Delete(":id")
    async delete(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
        const currentUser = req['user'];
        return await this.bookDemoService.delete(id);
    }

    @UseGuards(AuthGuard)
    @Get('view-setting')
    async viewSetting(@Req() req: Request) {
        const currentUser = req['user'];
        return await this.bookDemoService.viewSetting(currentUser.id);
    }

    @UseGuards(AuthGuard)
    @Put('update-setting')
    async updateSetting(@Body() dto: UpdateViewSettingDto, @Req() req: Request) {
        const currentUser = req['user'];
        return  await this.bookDemoService.updateSetting(dto);
    }

    @UseGuards(AuthGuard)
    @Get(':id')
    async getOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
        const currentUser = req['user'];
        return await this.bookDemoService.getOne(id);
    }
}
