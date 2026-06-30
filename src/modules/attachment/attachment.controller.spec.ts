import { Test, TestingModule } from '@nestjs/testing';
import { AttachmentController } from './attachment.controller';
import { AttachmentService } from './attachment.service';
import { AttachmentPolicy } from './attachment.policy';
import { StorageService } from 'src/common/storage/storage.service';

describe('AttachmentController', () => {
  let controller: AttachmentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttachmentController],
      providers: [
        {
          provide: AttachmentService,
          useValue: {},
        },
        {
          provide: AttachmentPolicy,
          useValue: {},
        },
        {
          provide: StorageService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AttachmentController>(AttachmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
