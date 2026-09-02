import { PartialType } from '@nestjs/mapped-types';
import { CreateBookDemoDto } from './book-demo-create.dto';

export class UpdateBookDemoDto extends PartialType(CreateBookDemoDto) {}