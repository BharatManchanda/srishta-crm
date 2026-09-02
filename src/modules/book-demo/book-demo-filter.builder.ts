import { Injectable } from '@nestjs/common';
import { PrismaFilter } from 'src/common/filters/prisma-filter.helper';
import { BookDemoFilterDto } from './dto/book-demo-filter.dto';

@Injectable()
export class BookDemoFilterBuilder {
	build(dto: BookDemoFilterDto) {
		const where: any = {
			id: PrismaFilter.equals(dto.id),
			name: PrismaFilter.contains(dto.name),
			email: PrismaFilter.contains(dto.email),
			company: PrismaFilter.contains(dto.company),
			phone: PrismaFilter.contains(dto.phone),
			
			teamSize: PrismaFilter.contains(dto.teamSize),
			industry: PrismaFilter.contains(dto.industry),
			message: PrismaFilter.contains(dto.message),

			status: PrismaFilter.equals(dto.status),
		};
		return where;
	}
}
