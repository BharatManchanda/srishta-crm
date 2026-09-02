import { PartialType } from '@nestjs/mapped-types';
import { CreateBlogDto } from './blogs-create.dto';

export class UpdateBlogDto extends PartialType(CreateBlogDto) {}