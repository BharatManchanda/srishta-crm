import { Test, TestingModule } from '@nestjs/testing';
import { ModuleFieldController } from './module-field.controller';

describe('ModuleFieldController', () => {
  let controller: ModuleFieldController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModuleFieldController],
    }).compile();

    controller = module.get<ModuleFieldController>(ModuleFieldController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
