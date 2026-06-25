// apps/backend/src/requests/dto/update-request-status.dto.ts

import { IsEnum, IsNotEmpty } from 'class-validator';
import { RequestStatus } from '@prisma/client';

export class UpdateRequestStatusDto {
  @IsEnum(
    { accepted: RequestStatus.accepted, rejected: RequestStatus.rejected, completed: RequestStatus.completed },
    { message: 'حالة الطلب غير صحيحة (مسموح بـ accepted, rejected, completed فقط)' },
  )
  @IsNotEmpty({ message: 'حالة الطلب مطلوبة' })
  status!: RequestStatus;
}
