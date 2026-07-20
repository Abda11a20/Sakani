import {
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationService } from './notifications.service';

type SafeUser = Omit<User, 'passwordHash'>;

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async findAll(
    @CurrentUser() user: SafeUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.notificationService.findAll(user.id, page, limit);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: SafeUser) {
    return this.notificationService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  async markAsRead(@CurrentUser() user: SafeUser, @Param('id') id: string) {
    return this.notificationService.markAsRead(user.id, id);
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: SafeUser) {
    return this.notificationService.markAllAsRead(user.id);
  }

  @Delete(':id')
  async deleteNotification(
    @CurrentUser() user: SafeUser,
    @Param('id') id: string,
  ) {
    return this.notificationService.deleteNotification(user.id, id);
  }

  @Delete()
  async deleteAllNotifications(@CurrentUser() user: SafeUser) {
    return this.notificationService.deleteAllNotifications(user.id);
  }
}
