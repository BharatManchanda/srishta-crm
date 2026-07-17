import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { NoteService } from './note.service';
import { NoteFilterDto } from './dto/note-filter.dto';
import { NoteCreateDto } from './dto/note-create.dto';
import { NoteUpdateDto } from './dto/note-update.dto';
import { NotePolicy } from './note.policy';
import { BulkNoteCreateDto } from './dto/bulk-note-create.dto';


@UseGuards(AuthGuard)
@Controller('note')
export class NoteController {
  constructor(
    private readonly noteService: NoteService,
    private readonly notePolicy: NotePolicy,
  ) {}

  @Get()
  async getList(@Query() dto: NoteFilterDto, @Req() req: Request) {
    await this.notePolicy.authorize(req['user'], 'viewAll');
    const authUserId = req['user'].id;
    return this.noteService.getList(dto, authUserId);
  }

  @Post()
  async create(@Body() dto: NoteCreateDto, @Req() req: Request) {
    await this.notePolicy.authorize(req['user'], 'create');
    const authUserId = req['user'].id;
    return this.noteService.create(dto, authUserId);
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    await this.notePolicy.authorize(req['user'], 'view', id);
    return this.noteService.get(id);
  }

  @Put(':id')
  async update(
    @Body() dto: NoteUpdateDto,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    await this.notePolicy.authorize(req['user'], 'update', id);
    const authUserId = req['user'].id;
    return this.noteService.update(dto, id, authUserId);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    await this.notePolicy.authorize(req['user'], 'delete', id);
    const authUserId = req['user'].id;
    return this.noteService.delete(id, authUserId);
  }

  @Post('bulk')
  async bulkCreate(@Body() dto: BulkNoteCreateDto, @Req() req: Request) {
    await this.notePolicy.authorize(req['user'], 'create');
    const authUserId = req['user'].id;
    return this.noteService.bulkCreate(dto, authUserId);
  }
}

