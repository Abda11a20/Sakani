// c:\Users\pc\Desktop\Sakany\sakani\apps\backend\src\reviews\reviews.controller.ts
import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards, ParseIntPipe, DefaultValuePipe, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

interface RequestWithUser {
  user: {
    id: string;
    role: UserRole;
  };
}

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.tenant)
  @Post()
  async createReview(@Req() req: RequestWithUser, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.id, dto);
  }

  @Get('listing/:listingId')
  async getListingReviews(
    @Param('listingId') listingId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.reviewsService.getListingReviews(listingId, page, limit);
  }

  @Get('landlord/:landlordId')
  async getLandlordReviews(
    @Param('landlordId') landlordId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.reviewsService.getLandlordReviews(landlordId, page, limit);
  }

  @Get('landlord/:landlordId/rating')
  async getLandlordRating(@Param('landlordId') landlordId: string) {
    return this.reviewsService.getLandlordRating(landlordId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteReview(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.reviewsService.deleteReview(id, req.user.id, req.user.role);
  }
}
