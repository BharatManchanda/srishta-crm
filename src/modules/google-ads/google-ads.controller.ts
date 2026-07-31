import { Controller } from '@nestjs/common';
import { GoogleAdsService } from './google-ads.service';

@Controller('google-ads')
export class GoogleAdsController {
    constructor(private readonly googleAdsService: GoogleAdsService) {
        
    }

    
}
