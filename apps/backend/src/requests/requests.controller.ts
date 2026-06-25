// apps/backend/src/requests/requests.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '@prisma/client';

type SafeUser = Omit<User, 'passwordHash'>;

@Controller('requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  // ── 1. إنشاء طلب معاينة (Tenant فقط) ──────────────────────────────────────
  @Post()
  @Roles(UserRole.tenant)
  async create(
    @CurrentUser() user: SafeUser,
    @Body() dto: CreateRequestDto,
  ) {
    return this.requestsService.create(user.id, dto);
  }

  // ── 2. جلب طلبات المستأجر ────────────────────────────────────────────────
  @Get('my/tenant')
  @Roles(UserRole.tenant)
  async getMyRequestsAsTenant(
    @CurrentUser() user: SafeUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.requestsService.getMyRequestsAsTenant(user.id, page, limit);
  }

  // ── 3. جلب الطلبات الواردة للمؤجر ─────────────────────────────────────────
  @Get('my/landlord')
  @Roles(UserRole.landlord)
  async getMyRequestsAsLandlord(
    @CurrentUser() user: SafeUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.requestsService.getMyRequestsAsLandlord(user.id, page, limit);
  }

  // ── 4. جلب إحصائيات المؤجر ───────────────────────────────────────────────
  @Get('my/landlord/stats')
  @Roles(UserRole.landlord)
  async getRequestStats(@CurrentUser() user: SafeUser) {
    return this.requestsService.getRequestStats(user.id);
  }

  // ── 5. جلب تفاصيل طلب واحد (Tenant | Landlord | Admin) ───────────────────
  @Get(':id')
  async getRequestDetails(
    @Param('id') id: string,
    @CurrentUser() user: SafeUser,
  ) {
    return this.requestsService.getRequestDetails(id, user.id, user.role);
  }

  // ── 6. تحديث حالة الطلب (Landlord فقط) ───────────────────────────────────
  @Patch(':id/status')
  @Roles(UserRole.landlord)
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: SafeUser,
    @Body() dto: UpdateRequestStatusDto,
  ) {
    return this.requestsService.updateStatus(id, user.id, dto);
  }

  // ── 7. إلغاء الطلب (Tenant فقط) ──────────────────────────────────────────
  @Delete(':id')
  @Roles(UserRole.tenant)
  async cancelRequest(
    @Param('id') id: string,
    @CurrentUser() user: SafeUser,
  ) {
    return this.requestsService.cancelRequest(id, user.id);
  }
}
