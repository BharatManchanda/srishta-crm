import { Test, TestingModule } from '@nestjs/testing';
import { ContactInquiryService } from './contact-inquiry.service';

describe('ContactInquiryService', () => {
  let service: ContactInquiryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContactInquiryService],
    }).compile();

    service = module.get<ContactInquiryService>(ContactInquiryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
