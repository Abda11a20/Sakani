// apps/backend/src/admin/dto/review-listing.dto.ts

import { IsEnum, IsString, IsNotEmpty, ValidateIf } from 'class-validator';
import { ListingStatus } from '@prisma/client';

export class ReviewListingDto {
  @IsEnum([ListingStatus.active, ListingStatus.rejected], {
    message: 'الحالة المقبولة هي active أو rejected فقط',
  })
  @IsNotEmpty({ message: 'الحالة مطلوبة' })
  status!: ListingStatus;

  @ValidateIf((o: ReviewListingDto) => o.status === ListingStatus.rejected)
  @IsString()
  @IsNotEmpty({ message: 'سبب الرفض مطلوب عند رفض الإعلان' })
  rejectionReason?: string;
}
