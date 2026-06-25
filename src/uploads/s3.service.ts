// c:\Users\pc\Desktop\Sakany\sakani\apps\backend\src\uploads\s3.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly isMockMode: boolean;
  private readonly logger = new Logger(S3Service.name);
  private readonly region: string;

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || 'dummy-secret';
    this.region = this.configService.get<string>('AWS_REGION') || 'eu-central-1';

    if (!accessKeyId || accessKeyId === 'your-access-key') {
      this.isMockMode = true;
      this.logger.warn('S3Service is running in MOCK MODE. Real uploads will be skipped.');
      // Initialize with dummy credentials to avoid SDK errors
      this.s3Client = new S3Client({
        region: this.region,
        credentials: { accessKeyId: 'dummy', secretAccessKey: 'dummy' },
      });
    } else {
      this.isMockMode = false;
      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }
  }

  async uploadFile(file: Express.Multer.File, bucket: string, key: string): Promise<string> {
    if (this.isMockMode) {
      this.logger.debug(`[MOCK] Uploading file to ${bucket}/${key}`);
      return `http://localhost:${this.configService.get('PORT') || 3001}/mock-s3/${bucket}/${key}`;
    }

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);
    return `https://${bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async uploadPrivateFile(file: Express.Multer.File, key: string): Promise<string> {
    const bucket = this.configService.get<string>('AWS_S3_ID_BUCKET');
    if (!bucket) {
      throw new Error('AWS_S3_ID_BUCKET is not defined');
    }

    if (this.isMockMode) {
      this.logger.debug(`[MOCK] Uploading private file to ${bucket}/${key}`);
      return key;
    }

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);
    return key;
  }

  async getPresignedUrl(key: string, bucket: string, expiresIn: number = 600): Promise<string> {
    if (this.isMockMode) {
      this.logger.debug(`[MOCK] Generating presigned URL for ${bucket}/${key} (expires in ${expiresIn}s)`);
      return `http://localhost:${this.configService.get('PORT') || 3001}/mock-s3/${bucket}/${key}?presigned=true&expiresIn=${expiresIn}`;
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async deleteFile(key: string, bucket: string): Promise<void> {
    if (this.isMockMode) {
      this.logger.debug(`[MOCK] Deleting file from ${bucket}/${key}`);
      return;
    }

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }
}

// We need GetObjectCommand to generate presigned URLs for reading
import { GetObjectCommand } from '@aws-sdk/client-s3';
