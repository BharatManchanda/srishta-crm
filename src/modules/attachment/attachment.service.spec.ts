import { Test, TestingModule } from '@nestjs/testing';
import { AttachmentService } from './attachment.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { AttachmentFilterBuilder } from './attachment-filter.builder';
import { UserHierarchyService } from '../user/user-hierarchy.service';

describe('AttachmentService', () => {
  let service: AttachmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachmentService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: PaginationService,
          useValue: {},
        },
        {
          provide: AttachmentFilterBuilder,
          useValue: {},
        },
        {
          provide: UserHierarchyService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AttachmentService>(AttachmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
