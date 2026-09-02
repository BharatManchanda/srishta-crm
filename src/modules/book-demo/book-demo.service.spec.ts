import { Test, TestingModule } from '@nestjs/testing';
import { BookDemoService } from './book-demo.service';

describe('BookDemoService', () => {
  let service: BookDemoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BookDemoService],
    }).compile();

    service = module.get<BookDemoService>(BookDemoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
