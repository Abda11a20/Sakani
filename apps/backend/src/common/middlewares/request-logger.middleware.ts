// apps/backend/src/common/middlewares/request-logger.middleware.ts

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') ?? '';
    const startTime = Date.now();
    const requestId = req['requestId'] || req.headers['x-request-id'] || 'N/A';

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;

      this.logger.log(
        `[ReqID: ${requestId}] ${method} ${originalUrl} ${statusCode} - ${ip} - ${duration}ms - ${userAgent}`
      );
    });

    next();
  }
}
