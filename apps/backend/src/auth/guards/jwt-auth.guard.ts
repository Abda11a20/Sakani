// apps/backend/src/auth/guards/jwt-auth.guard.ts

import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ALLOW_SOFT_DELETED_KEY } from '../decorators/allow-soft-deleted.decorator';
import { ErrorCode } from '../../common/constants/error-codes.enum';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector?: Reflector) {
    super();
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      const isExpired = info?.name === 'TokenExpiredError';
      throw new UnauthorizedException({
        statusCode: 401,
        code: isExpired
          ? ErrorCode.AUTH_TOKEN_EXPIRED
          : ErrorCode.AUTH_INVALID_TOKEN,
        message: isExpired
          ? 'انتهت جلسة تسجيل الدخول، يرجى إعادة تسجيل الدخول'
          : 'يرجى تسجيل الدخول أولاً',
      });
    }

    const allowSoftDeleted = this.reflector?.getAllAndOverride<boolean>(
      ALLOW_SOFT_DELETED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if ((user.deletedAt || user.isDeleted) && !allowSoftDeleted) {
      const remainingDays = user.scheduledFinalDeleteAt
        ? Math.max(
            1,
            Math.floor(
              (new Date(user.scheduledFinalDeleteAt).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24),
            ),
          )
        : 30;

      throw new ForbiddenException({
        statusCode: 403,
        code: 'ACCOUNT_SOFT_DELETED',
        remainingDays,
        message: `حسابك محذوف وفي فترة السماح (باقي ${remainingDays} يوماً على الحذف النهائي). يمكنك استعادة حسابك أولاً.`,
      });
    }

    return user;
  }
}
