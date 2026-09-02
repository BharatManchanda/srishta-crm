import { Test, TestingModule } from '@nestjs/testing';
import { BookDemoController } from './book-demo.controller';

describe('BookDemoController', () => {
  let controller: BookDemoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookDemoController],
    }).compile();

    controller = module.get<BookDemoController>(BookDemoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
