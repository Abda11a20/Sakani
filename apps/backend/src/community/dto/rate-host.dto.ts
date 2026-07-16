// apps/backend/src/community/dto/rate-host.dto.ts

import { IsInt, Min, Max } from 'class-validator';

export class RateHostDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;
}
