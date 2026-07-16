// apps/backend/src/search/search.controller.ts

import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query() query: SearchQueryDto) {
    return this.searchService.search(query);
  }

  @Get('popular-districts')
  async getPopularDistricts() {
    return this.searchService.getPopularDistricts();
  }

  @Get('suggested/:listingId')
  async getSuggestedListings(@Param('listingId') listingId: string) {
    return this.searchService.getSuggestedListings(listingId);
  }

  @Get('price-stats')
  async getPriceStats(
    @Query('governorate') governorate?: string,
    @Query('district') district?: string,
  ) {
    return this.searchService.getPriceStats(governorate, district);
  }
}
