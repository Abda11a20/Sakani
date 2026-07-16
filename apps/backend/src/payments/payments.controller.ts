// apps/backend/src/payments/payments.controller.ts

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Headers,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '@prisma/client';

interface RequestWithUser {
  user: {
    id: string;
    role: UserRole;
  };
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // GET /payments/plan — current user's plan
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('plan')
  async getCurrentPlan(@Req() req: RequestWithUser) {
    return this.paymentsService.getCurrentPlan(req.user.id);
  }

  // POST /payments/initiate — create a payment request
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('initiate')
  async initiatePayment(
    @Req() req: RequestWithUser,
    @Body() dto: InitiatePaymentDto,
  ) {
    return this.paymentsService.initiatePayment(req.user.id, dto);
  }

  // POST /payments/webhook — Paymob sends directly here (no JWT)
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() payload: Record<string, unknown>,
    @Headers('hmac') hmacHeader: string,
  ) {
    return this.paymentsService.handleWebhook(payload, hmacHeader ?? '');
  }

  // GET /payments/history — subscription history
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getSubscriptionHistory(@Req() req: RequestWithUser) {
    return this.paymentsService.getSubscriptionHistory(req.user.id);
  }

  // DELETE /payments/subscription — cancel active subscription
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('subscription')
  async cancelSubscription(@Req() req: RequestWithUser) {
    return this.paymentsService.cancelSubscription(req.user.id);
  }
}
