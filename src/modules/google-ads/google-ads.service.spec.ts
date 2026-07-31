import { Test, TestingModule } from '@nestjs/testing';
import { GoogleAdsService } from './google-ads.service';

describe('GoogleAdsService', () => {
  let service: GoogleAdsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleAdsService],
    }).compile();

    service = module.get<GoogleAdsService>(GoogleAdsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
