import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Req,
  Ip,
  Headers,
} from '@nestjs/common';
import { AdsService } from './ads.service';
import { GetActiveAdQueryDto } from './dto/ad-query.dto';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  /**
   * GET /api/v1/ads/active
   * Fetch active ad for placement slot (Zero footprint if none -> returns null)
   */
  @Get('active')
  async getActiveAd(@Query() query: GetActiveAdQueryDto) {
    return this.adsService.getActiveAdForSlot(query);
  }

  /**
   * POST /api/v1/ads/:id/impression
   * Track view impression event
   */
  @Post(':id/impression')
  async trackImpression(
    @Param('id') adId: string,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('referer') referrer?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.adsService.recordImpression(adId, {
      userId: req.user?.id,
      referrer,
      ip,
      userAgent,
    });
  }

  /**
   * POST /api/v1/ads/:id/click
   * Track click event & return redirect target
   */
  @Post(':id/click')
  async trackClick(
    @Param('id') adId: string,
    @Req() req: any,
    @Ip() ip: string,
    @Headers('referer') referrer?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.adsService.recordClick(adId, {
      userId: req.user?.id,
      referrer,
      ip,
      userAgent,
    });
  }
}
