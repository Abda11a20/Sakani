// apps/backend/src/auth/interfaces/jwt-payload.interface.ts

import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  phone: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
