import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  // List of sensitive keys to redact from logs
  private readonly SENSITIVE_KEYS = [
    'password',
    'confirmPassword',
    'currentPassword',
    'newPassword',
    'otp',
    'refreshToken',
    'accessToken',
    'nationalId',
    'authorization',
    'cookie',
  ];

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    const errorMessage =
      typeof errorResponse === 'object' && errorResponse !== null
        ? (errorResponse as any).message || errorResponse
        : errorResponse;

    const reqId = request['requestId'] || 'N/A';
    // If you have a logged-in user attached to the request
    const userId = (request.user as any)?.id || 'unauthenticated';
    const ip = (request.headers['x-forwarded-for'] as string)?.split(',')[0] || request.ip;

    // Redact sensitive headers/body if we log them later (currently just logging standard fields)
    
    // Log format: Time, UserId, RequestId, IP, Method, Route, StatusCode, Error, Stack
    const logData = {
      timestamp: new Date().toISOString(),
      userId,
      requestId: reqId,
      ip,
      method: request.method,
      path: request.url,
      statusCode: status,
      error: errorMessage,
      stack: exception instanceof Error ? exception.stack : 'No stack trace',
    };

    // We use NestJS Logger. In production, this would be picked up by a log aggregator (like Datadog/ELK)
    this.logger.error(
      `[${logData.requestId}] ${logData.method} ${logData.path} - ${logData.statusCode} - Error: ${JSON.stringify(logData.error)}`,
      logData.stack,
    );

    // Filter sensitive info from response body sent to client
    const safeResponse = {
      success: false,
      statusCode: status,
      timestamp: logData.timestamp,
      path: request.url,
      message: status === 500 ? 'Internal server error' : errorMessage,
      requestId: reqId,
    };

    response.status(status).json(safeResponse);
  }
}
