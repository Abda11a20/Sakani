// c:\Users\pc\Desktop\Sakany\sakani\apps\backend\src\uploads\uploads.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from './s3.service';
import { v2 as cloudinary } from 'cloudinary';
import * as crypto from 'crypto';
import * as path from 'path';

@Injectable()
export class UploadsService {
  private readonly publicBucket: string;
  private readonly privateBucket: string;

  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    private configService: ConfigService,
  ) {
    this.publicBucket = this.configService.get<string>('AWS_S3_BUCKET') || 'sakani-uploads';
    this.privateBucket = this.configService.get<string>('AWS_S3_ID_BUCKET') || 'sakani-ids';

    const provider = this.configService.get<string>('STORAGE_PROVIDER') || 's3';
    if (provider === 'cloudinary') {
      cloudinary.config({
        cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
        api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
        api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
      });
    }
  }

  private generateFileName(originalName: string): string {
    const ext = path.extname(originalName);
    const randomName = crypto.randomBytes(16).toString('hex');
    return `${Date.now()}-${randomName}${ext}`;
  }

  private async uploadToCloudinary(
    file: Express.Multer.File,
    folder: string,
    type: 'upload' | 'authenticated',
  ): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          type,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error || !result) {
            return reject(error || new Error('Cloudinary upload returned no result'));
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        },
      );
      uploadStream.end(file.buffer);
    });
  }

  async destroyCloudinaryAsset(publicId: string, type: 'upload' | 'authenticated' = 'upload') {
    try {
      await cloudinary.uploader.destroy(publicId, { type });
    } catch (e) {
      console.warn(`Failed to destroy Cloudinary asset: ${publicId}`, e);
    }
  }

  async uploadListingImage(listingId: string, landlordId: string, file: Express.Multer.File, order: number) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('الإعلان غير موجود');
    }

    if (listing.landlordId !== landlordId) {
      throw new ForbiddenException('ليس لديك صلاحية لإضافة صور لهذا الإعلان');
    }

    const provider = this.configService.get<string>('STORAGE_PROVIDER') || 's3';

    let key: string;
    let url: string;

    if (provider === 'cloudinary') {
      const res = await this.uploadToCloudinary(file, 'sakany/listings', 'upload');
      key = res.publicId;
      url = res.url;
    } else {
      const fileName = this.generateFileName(file.originalname);
      key = `listings/${listingId}/${fileName}`;
      url = await this.s3Service.uploadFile(file, this.publicBucket, key);
    }

    const image = await this.prisma.listingImage.create({
      data: {
        listingId,
        s3Key: key,
        url,
        order,
      },
    });

    return image;
  }

  async uploadListingImages(listingId: string, landlordId: string, files: Express.Multer.File[]) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('الإعلان غير موجود');
    }

    if (listing.landlordId !== landlordId) {
      throw new ForbiddenException('ليس لديك صلاحية لإضافة صور لهذا الإعلان');
    }

    const currentImagesCount = await this.prisma.listingImage.count({
      where: { listingId },
    });

    const uploadPromises = files.map((file, index) => {
      return this.uploadListingImage(listingId, landlordId, file, currentImagesCount + index);
    });

    return await Promise.all(uploadPromises);
  }

  async deleteListingImage(imageId: string, landlordId: string) {
    const image = await this.prisma.listingImage.findUnique({
      where: { id: imageId },
      include: { listing: true },
    });

    if (!image) {
      throw new NotFoundException('الصورة غير موجودة');
    }

    if (image.listing.landlordId !== landlordId) {
      throw new ForbiddenException('ليس لديك صلاحية لحذف هذه الصورة');
    }

    const provider = this.configService.get<string>('STORAGE_PROVIDER') || 's3';

    if (provider === 'cloudinary') {
      await this.destroyCloudinaryAsset(image.s3Key, 'upload');
    } else {
      await this.s3Service.deleteFile(image.s3Key, this.publicBucket);
    }

    await this.prisma.listingImage.delete({
      where: { id: imageId },
    });

    return { success: true, message: 'تم حذف الصورة بنجاح' };
  }

  async reorderImages(listingId: string, landlordId: string, imageIds: string[]) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing || listing.landlordId !== landlordId) {
      throw new ForbiddenException('ليس لديك صلاحية لتعديل صور هذا الإعلان');
    }

    const updatePromises = imageIds.map((id, index) => {
      return this.prisma.listingImage.updateMany({
        where: { id, listingId },
        data: { order: index },
      });
    });

    await this.prisma.$transaction(updatePromises);

    return { success: true, message: 'تم تحديث ترتيب الصور بنجاح' };
  }

  async uploadIdCard(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const provider = this.configService.get<string>('STORAGE_PROVIDER') || 's3';

    let key: string;

    if (user.idCardPublicId) {
      if (provider === 'cloudinary') {
        await this.destroyCloudinaryAsset(user.idCardPublicId, 'authenticated');
      } else {
        await this.s3Service.deleteFile(user.idCardPublicId, this.privateBucket);
      }
    }

    if (provider === 'cloudinary') {
      const res = await this.uploadToCloudinary(file, 'sakany/national-ids', 'authenticated');
      key = res.publicId;
    } else {
      const fileName = this.generateFileName(file.originalname);
      key = `id-cards/${userId}/${fileName}`;
      await this.s3Service.uploadPrivateFile(file, key);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        idCardPublicId: key,
      },
    });

    return { success: true, message: 'تم رفع صورة البطاقة بنجاح' };
  }

  async getIdCardPresignedUrl(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, idCardPublicId: true },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    if (!user.idCardPublicId) {
      throw new NotFoundException('لا توجد بطاقة هوية لهذا المستخدم');
    }

    const provider = this.configService.get<string>('STORAGE_PROVIDER') || 's3';

    let url: string;

    if (provider === 'cloudinary') {
      url = cloudinary.url(user.idCardPublicId, {
        type: 'authenticated',
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 600,
      });
    } else {
      url = await this.s3Service.getPresignedUrl(user.idCardPublicId, this.privateBucket, 600);
    }

    return { url };
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const provider = this.configService.get<string>('STORAGE_PROVIDER') || 's3';

    let key: string;
    let url: string;

    if (user.avatarPublicId) {
      if (provider === 'cloudinary') {
        await this.destroyCloudinaryAsset(user.avatarPublicId, 'upload');
      } else {
        await this.s3Service.deleteFile(user.avatarPublicId, this.publicBucket);
      }
    }

    if (provider === 'cloudinary') {
      const res = await this.uploadToCloudinary(file, 'sakany/avatars', 'upload');
      key = res.publicId;
      url = res.url;
    } else {
      const fileName = this.generateFileName(file.originalname);
      key = `avatars/${userId}/${fileName}`;
      url = await this.s3Service.uploadFile(file, this.publicBucket, key);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: url,
        avatarPublicId: key,
      },
    });

    return { url, message: 'تم رفع الصورة الشخصية بنجاح' };
  }

  async deleteUserAssets(avatarPublicId?: string | null, idCardPublicId?: string | null) {
    const provider = this.configService.get<string>('STORAGE_PROVIDER') || 's3';

    if (avatarPublicId) {
      if (provider === 'cloudinary') {
        await this.destroyCloudinaryAsset(avatarPublicId, 'upload');
      } else {
        await this.s3Service.deleteFile(avatarPublicId, this.publicBucket);
      }
    }

    if (idCardPublicId) {
      if (provider === 'cloudinary') {
        await this.destroyCloudinaryAsset(idCardPublicId, 'authenticated');
      } else {
        await this.s3Service.deleteFile(idCardPublicId, this.privateBucket);
      }
    }
  }
}
