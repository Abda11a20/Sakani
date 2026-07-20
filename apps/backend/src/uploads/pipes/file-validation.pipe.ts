// apps/backend/src/uploads/pipes/file-validation.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

export interface FileValidationOptions {
  maxSize: number;
  allowedTypes: string[];
}

// Magic Numbers (real file signatures - cannot be faked by changing extension)
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header for WebP
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
};

function detectRealMime(buffer: Buffer): string | null {
  for (const [mime, signatures] of Object.entries(MAGIC_BYTES)) {
    for (const sig of signatures) {
      if (sig.every((byte, i) => buffer[i] === byte)) return mime;
    }
  }
  return null;
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(private readonly options: FileValidationOptions) {}

  transform(value: any) {
    if (!value) {
      throw new BadRequestException('لم يتم رفع أي ملف');
    }

    const files: Express.Multer.File[] = Array.isArray(value) ? value : [value];

    if (files.length === 0) {
      throw new BadRequestException('لم يتم رفع أي ملف');
    }

    for (const file of files) {
      // 1. Check size
      if (file.size > this.options.maxSize) {
        const maxSizeMB = this.options.maxSize / (1024 * 1024);
        throw new BadRequestException(
          `حجم الملف يتجاوز الحد الأقصى (${maxSizeMB}MB)`,
        );
      }

      // 2. Verify real MIME via magic bytes (prevents file type spoofing)
      const realMime = detectRealMime(file.buffer);
      if (!realMime || !this.options.allowedTypes.includes(realMime)) {
        throw new BadRequestException(
          `نوع الملف غير مسموح به. الأنواع المسموح بها: ${this.options.allowedTypes.join(', ')}`,
        );
      }

      // 3. Ensure declared MIME matches the actual content
      if (file.mimetype !== realMime) {
        throw new BadRequestException('تم اكتشاف تزوير في نوع الملف');
      }
    }

    return value;
  }
}
