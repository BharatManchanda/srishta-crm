import { Test, TestingModule } from '@nestjs/testing';
import { ContactInquiryController } from './contact-inquiry.controller';

describe('ContactInquiryController', () => {
  let controller: ContactInquiryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactInquiryController],
    }).compile();

    controller = module.get<ContactInquiryController>(ContactInquiryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
