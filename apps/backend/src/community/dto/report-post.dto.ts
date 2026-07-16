// apps/backend/src/community/dto/report-post.dto.ts

import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ReportReason } from '@prisma/client';

export class ReportPostDto {
  @IsEnum(ReportReason)
  reason: ReportReason;

  @IsString()
  @IsOptional()
  details?: string;
}
