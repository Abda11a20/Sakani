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
    const ip =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      request.ip;

    // For 500 errors: log the exception class name + stack for easier production debugging
    const exceptionName =
      exception instanceof Error ? exception.constructor.name : 'UnknownError';
    const stackTrace =
      exception instanceof Error ? exception.stack : 'No stack trace';

    this.logger.error(
      `[${reqId}, ${reqId}] ${request.method} ${request.url} - ${status} - Error: ${JSON.stringify(errorMessage)}`,
      status === 500 ? `[${exceptionName}] ${stackTrace}` : undefined,
    );

    // Safe response - never expose stack traces or internal details to the client
    const safeResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: status === 500 ? 'Internal server error' : errorMessage,
      requestId: reqId,
    };

    response.status(status).json(safeResponse);
  }
}
