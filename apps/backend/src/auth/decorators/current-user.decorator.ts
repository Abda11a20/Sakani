// apps/backend/src/auth/decorators/current-user.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Omit<User, 'passwordHash'> => {
    const request = ctx.switchToHttp().getRequest<Request & { user: Omit<User, 'passwordHash'> }>();
    return request.user;
  },
);
