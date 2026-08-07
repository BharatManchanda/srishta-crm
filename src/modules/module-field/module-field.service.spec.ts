import { Test, TestingModule } from '@nestjs/testing';
import { ModuleFieldService } from './module-field.service';

describe('ModuleFieldService', () => {
  let service: ModuleFieldService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModuleFieldService],
    }).compile();

    service = module.get<ModuleFieldService>(ModuleFieldService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
