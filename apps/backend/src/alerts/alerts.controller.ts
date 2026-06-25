// apps/backend/src/alerts/alerts.controller.ts

import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

interface RequestWithUser {
  user: {
    id: string;
    role: UserRole;
  };
}

@Controller('alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.tenant)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  async create(@Req() req: RequestWithUser, @Body() dto: CreateAlertDto) {
    return this.alertsService.create(req.user.id, dto);
  }

  @Get('my')
  async getMyAlerts(@Req() req: RequestWithUser) {
    return this.alertsService.getMyAlerts(req.user.id);
  }

  @Patch(':id')
  async updateAlert(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateAlertDto,
  ) {
    return this.alertsService.updateAlert(id, req.user.id, dto);
  }

  @Patch(':id/toggle')
  async toggleAlert(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.alertsService.toggleAlert(id, req.user.id);
  }

  @Delete(':id')
  async deleteAlert(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.alertsService.deleteAlert(id, req.user.id);
  }
}
