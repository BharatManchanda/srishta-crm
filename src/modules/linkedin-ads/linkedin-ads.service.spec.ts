import { Test, TestingModule } from '@nestjs/testing';
import { LinkedinAdsService } from './linkedin-ads.service';

describe('LinkedinAdsService', () => {
  let service: LinkedinAdsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LinkedinAdsService],
    }).compile();

    service = module.get<LinkedinAdsService>(LinkedinAdsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
