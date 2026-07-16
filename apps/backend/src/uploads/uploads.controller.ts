// c:\Users\pc\Desktop\Sakany\sakani\apps\backend\src\uploads\uploads.controller.ts
import { Controller, Post, Delete, Patch, Get, Param, Body, UploadedFile, UploadedFiles, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { FileValidationPipe } from './pipes/file-validation.pipe';

interface RequestWithUser {
  user: {
    id: string;
    role: UserRole;
  };
}

@ApiTags('Uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.landlord)
  @Post('listings/:listingId/images')
  @UseInterceptors(FilesInterceptor('images', 10))
  async uploadListingImages(
    @Req() req: RequestWithUser,
    @Param('listingId') listingId: string,
    @UploadedFiles(
      new FileValidationPipe({
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      }),
    )
    files: Express.Multer.File[],
  ) {
    return this.uploadsService.uploadListingImages(listingId, req.user.id, files);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.landlord)
  @Delete('images/:imageId')
  async deleteListingImage(@Req() req: RequestWithUser, @Param('imageId') imageId: string) {
    return this.uploadsService.deleteListingImage(imageId, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.landlord)
  @Patch('listings/:listingId/images/reorder')
  async reorderImages(
    @Req() req: RequestWithUser,
    @Param('listingId') listingId: string,
    @Body('imageIds') imageIds: string[],
  ) {
    return this.uploadsService.reorderImages(listingId, req.user.id, imageIds);
  }

  @UseGuards(JwtAuthGuard)
  @Post('id-card')
  @UseInterceptors(FileInterceptor('idCard'))
  async uploadIdCard(
    @Req() req: RequestWithUser,
    @UploadedFile(
      new FileValidationPipe({
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.uploadsService.uploadIdCard(req.user.id, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.super_admin)
  @Get('id-card/:userId')
  async getIdCardPresignedUrl(@Req() req: RequestWithUser, @Param('userId') userId: string) {
    return this.uploadsService.getIdCardPresignedUrl(userId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Req() req: RequestWithUser,
    @UploadedFile(
      new FileValidationPipe({
        maxSize: 2 * 1024 * 1024, // 2MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.uploadsService.uploadAvatar(req.user.id, file);
  }

  @UseGuards(JwtAuthGuard)
  @Post('chat')
  @UseInterceptors(FileInterceptor('file'))
  async uploadChatAttachment(
    @Req() req: RequestWithUser,
    @UploadedFile(
      new FileValidationPipe({
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.uploadsService.uploadChatAttachment(req.user.id, file);
  }
}
