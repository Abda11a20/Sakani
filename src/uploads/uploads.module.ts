// c:\Users\pc\Desktop\Sakany\sakani\apps\backend\src\uploads\uploads.module.ts
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { S3Service } from './s3.service';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  providers: [S3Service, UploadsService],
  controllers: [UploadsController],
  exports: [S3Service, UploadsService],
})
export class UploadsModule {}
