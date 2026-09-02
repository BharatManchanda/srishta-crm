import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { BlogsService } from './blogs.service';
import { BlogsFilterDto } from './dto/blogs-filter.dto';
import { UpdateViewSettingDto } from './dto/update-view-setting.dto';
import { CreateBlogDto } from './dto/blogs-create.dto';
import { StorageService } from 'src/common/storage/storage.service';
import { BlogsUploadUrlDto } from './dto/blogs-upload-url.dto';
import { UpdateBlogDto } from './dto/blogs-update.dto';

@UseGuards(AuthGuard)
@Controller('blogs')
export class BlogsController {
    constructor(
        private readonly blogsService: BlogsService,
        private readonly storageService: StorageService,
    ) { }
    
    @Get()
    async getList(@Query() dto: BlogsFilterDto) {
        const result = await this.blogsService.getList(dto);
        return result;
    }

    @Get("categories")
    async getCategoriesList() {
        return await this.blogsService.getCategoriesList();
    }

    @Get('view-setting')
    async viewSetting(@Req() req: Request) {
        const authUserId = req['user'].id;
        return await this.blogsService.viewSetting(authUserId);
    }
    
    @Get("id/:id")
    async getOne(@Param("id", ParseIntPipe) id: number) {
        return this.blogsService.getOne(id);
    }

    @Get("slug/:slug")
    async getBySlug(@Param("slug") slug: string) {
        return this.blogsService.getBySlug(slug);
    }

    @Post()
    async create(@Body() dto: CreateBlogDto, @Req() req: Request) {
        const authUserId = req['user'].id;
        return await this.blogsService.create(dto, authUserId);
    }
    
    @Put(':id')
    async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBlogDto, @Req() req: Request) {
        const authUserId = req['user'].id;
        return await this.blogsService.update(id, dto, authUserId);
    }

    @Put('update-setting')
    async updateSetting(@Body() dto: UpdateViewSettingDto, @Req() req: Request) {
        const authUserId = req['user'].id;
        return  await this.blogsService.updateSetting(dto, authUserId);
    }

    @Post('upload-url')
    async uploadUrl(@Body() dto: BlogsUploadUrlDto) {
        return await this.storageService.createUploadUrl("blogs", dto.fileName, dto.mimeType);
    }

}