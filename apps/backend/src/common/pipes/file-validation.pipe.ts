// apps/backend/src/common/pipes/file-validation.pipe.ts

import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// Image magic bytes (file signatures / "magic numbers")
const ALLOWED_MIME_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [
    [0xff, 0xd8, 0xff], // JPEG
  ],
  'image/png': [
    [0x89, 0x50, 0x4e, 0x47], // PNG
  ],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46], // RIFF (WebP container starts with RIFF)
  ],
};

function detectMimeFromBuffer(buffer: Buffer): string | null {
  for (const [mime, signatures] of Object.entries(ALLOWED_MIME_SIGNATURES)) {
    for (const sig of signatures) {
      const matches = sig.every((byte, i) => buffer[i] === byte);
      if (matches) return mime;
    }
  }
  return null;
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('لم يتم تحميل أي ملف');
    }

    // 1. Check size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('حجم الملف يتجاوز الحد المسموح به (5MB)');
    }

    // 2. Check real MIME from buffer (magic bytes) — not the extension
    const detectedMime = detectMimeFromBuffer(file.buffer);
    if (!detectedMime) {
      throw new BadRequestException(
        'نوع الملف غير مسموح به. يُسمح فقط بـ JPEG و PNG و WebP',
      );
    }

    // 3. Also verify the declared MIME matches the detected one
    const allowedTypes = Object.keys(ALLOWED_MIME_SIGNATURES);
    if (!allowedTypes.includes(file.mimetype) || file.mimetype !== detectedMime) {
      throw new BadRequestException(
        'نوع الملف غير مسموح به أو تم تزوير الامتداد',
      );
    }

    return file;
  }
}
