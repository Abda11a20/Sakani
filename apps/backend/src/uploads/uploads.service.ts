// c:\Users\pc\Desktop\Sakany\sakani\apps\backend\src\uploads\uploads.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
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
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    private configService: ConfigService,
  ) {
    this.publicBucket =
      this.configService.get<string>('AWS_S3_BUCKET') || 'sakani-uploads';
    this.privateBucket =
      this.configService.get<string>('AWS_S3_ID_BUCKET') || 'sakani-ids';

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
    transformation?: any,
  ): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const uploadOptions: any = {
        folder,
        type,
        resource_type: 'auto',
      };
      if (transformation) {
        uploadOptions.transformation = transformation;
      }
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error || !result) {
            return reject(
              error || new Error('Cloudinary upload returned no result'),
            );
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

  async destroyCloudinaryAsset(
    publicId: string,
    type: 'upload' | 'authenticated' = 'upload',
  ) {
    try {
      await cloudinary.uploader.destroy(publicId, { type });
    } catch (e) {
      console.warn(`Failed to destroy Cloudinary asset: ${publicId}`, e);
    }
  }

  async uploadListingImage(
    listingId: string,
    landlordId: string,
    file: Express.Multer.File,
    order: number,
  ) {
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

    try {
      if (provider === 'cloudinary') {
        const res = await this.uploadToCloudinary(
          file,
          'sakany/listings',
          'upload',
        );
        key = res.publicId;
        url = res.url;
      } else {
        const fileName = this.generateFileName(file.originalname);
        key = `listings/${listingId}/${fileName}`;
        url = await this.s3Service.uploadFile(file, this.publicBucket, key);
      }
    } catch (error: any) {
      this.logger.error(
        `Failed to upload listing image to ${provider}: ${error?.message || error}`,
        error?.stack,
      );
      throw new InternalServerErrorException(
        `فشل تحميل الصورة إلى السيرفر. يرجى التحقق من إعدادات التخزين السحابي (${provider})`,
      );
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

  /**
   * Upload public media used by an advertisement. The advertisement record is
   * deliberately not touched here: the caller only receives a stable URL and
   * persists it after the rest of the ad form has validated successfully.
   */
  async uploadAdvertisementMedia(file: Express.Multer.File) {
    const provider = this.configService.get<string>('STORAGE_PROVIDER') || 's3';

    try {
      if (provider === 'cloudinary') {
        const result = await this.uploadToCloudinary(
          file,
          'sakany/ads',
          'upload',
        );
        return { url: result.url, key: result.publicId };
      }

      const fileName = this.generateFileName(file.originalname);
      const key = `ads/${fileName}`;
      const url = await this.s3Service.uploadFile(file, this.publicBucket, key);
      return { url, key };
    } catch (error: any) {
      this.logger.error(
        `Failed to upload advertisement media to ${provider}: ${error?.message || error}`,
        error?.stack,
      );
      throw new InternalServerErrorException('Failed to upload advertisement media');
    }
  }

  /**
   * Moves a small, explicit batch of legacy data-URL ad media to the configured
   * storage provider. Failed records are left completely unchanged, so this is
   * safe to run repeatedly after deployment.
   */
  async migrateLegacyAdvertisementMedia(limit = 20) {
    const mediaItems = await this.prisma.adMedia.findMany({
      where: { url: { startsWith: 'data:' } },
      orderBy: { createdAt: 'asc' },
      take: Math.min(Math.max(limit, 1), 50),
    });

    let migrated = 0;
    let skipped = 0;
    const failures: Array<{ id: string; reason: string }> = [];

    for (const media of mediaItems) {
      const match = /^data:([^;,]+);base64,([\s\S]+)$/.exec(media.url);
      if (!match) {
        skipped += 1;
        continue;
      }

      const [, mimetype, encoded] = match;
      if (!['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'].includes(mimetype)) {
        skipped += 1;
        continue;
      }

      try {
        const extension = mimetype.split('/')[1] || 'bin';
        const uploaded = await this.uploadAdvertisementMedia({
          buffer: Buffer.from(encoded, 'base64'),
          originalname: `legacy-ad-${media.id}.${extension}`,
          mimetype,
          size: Buffer.byteLength(encoded, 'base64'),
        } as Express.Multer.File);

        // The DB row is changed only after the remote upload has succeeded.
        await this.prisma.adMedia.update({
          where: { id: media.id },
          data: { url: uploaded.url },
        });
        migrated += 1;
      } catch (error: any) {
        failures.push({
          id: media.id,
          reason: error?.message || 'Upload failed',
        });
      }
    }

    return {
      scanned: mediaItems.length,
      migrated,
      skipped,
      failed: failures.length,
      failures,
    };
  }

  async uploadListingImages(
    listingId: string,
    landlordId: string,
    files: Express.Multer.File[],
  ) {
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
      return this.uploadListingImage(
        listingId,
        landlordId,
        file,
        currentImagesCount + index,
      );
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

  async reorderImages(
    listingId: string,
    landlordId: string,
    imageIds: string[],
  ) {
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
        await this.s3Service.deleteFile(
          user.idCardPublicId,
          this.privateBucket,
        );
      }
    }

    if (provider === 'cloudinary') {
      const res = await this.uploadToCloudinary(
        file,
        'sakany/national-ids',
        'authenticated',
      );
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
      url = await this.s3Service.getPresignedUrl(
        user.idCardPublicId,
        this.privateBucket,
        600,
      );
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
      const res = await this.uploadToCloudinary(
        file,
        'sakany/avatars',
        'upload',
        {
          width: 500,
          height: 500,
          crop: 'fill',
          gravity: 'face',
          quality: 'auto',
          fetch_format: 'auto',
        },
      );
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

  async uploadChatAttachment(userId: string, file: Express.Multer.File) {
    const provider = this.configService.get<string>('STORAGE_PROVIDER') || 's3';

    let key: string;
    let url: string;

    try {
      if (provider === 'cloudinary') {
        const res = await this.uploadToCloudinary(
          file,
          'sakany/chat',
          'upload',
        );
        key = res.publicId;
        url = res.url;
      } else {
        const fileName = this.generateFileName(file.originalname);
        key = `chat/${userId}/${fileName}`;
        url = await this.s3Service.uploadFile(file, this.publicBucket, key);
      }

      return {
        url,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload chat attachment: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('حدث خطأ أثناء رفع الملف.');
    }
  }

  async deleteUserAssets(
    avatarPublicId?: string | null,
    idCardPublicId?: string | null,
  ) {
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

  // ── Utility: Delete a file from storage by key ─────────────────────────────
  // Used by AdminService to delete listing images by s3Key
  async deleteFileByKey(key: string): Promise<void> {
    const provider = this.configService.get<string>('STORAGE_PROVIDER') || 's3';
    if (provider === 'cloudinary') {
      await this.destroyCloudinaryAsset(key, 'upload');
    } else {
      await this.s3Service.deleteFile(key, this.publicBucket);
    }
  }
}
