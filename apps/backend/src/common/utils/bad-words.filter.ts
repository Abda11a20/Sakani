// apps/backend/src/common/utils/bad-words.filter.ts

import { BadRequestException } from '@nestjs/common';

const BAD_WORDS_AR = [
  'كس', 'شرموط', 'قحبة', 'خول', 'عرص', 'منيوك', 'منيوكة', 'ديوث',
  'سكس', 'جنس', 'بورن', 'شذوذ', 'شاذ', 'لوطي', 'سحاق', 'زب',
  'طيز', 'ابن الكلب', 'احا', 'أحا', 'شرموطة', 'عرصنة', 'منيكة',
  'فاجرة', 'عاهرة', 'داعر', 'عهر'
];

const BAD_WORDS_EN = [
  'fuck', 'shit', 'asshole', 'bitch', 'cunt', 'dick', 'pussy', 'bastard',
  'porn', 'sex', 'nude', 'slut', 'whore', 'gay', 'lesbian', 'faggot'
];

export class BadWordsFilter {
  private static readonly badWords = new Set([
    ...BAD_WORDS_AR.map(w => w.trim().toLowerCase()),
    ...BAD_WORDS_EN.map(w => w.trim().toLowerCase())
  ]);

  /**
   * Checks if the text contains any bad words.
   */
  static hasBadWords(text: string | null | undefined): boolean {
    if (!text) return false;
    
    // Normalize text (lowercase, remove extra punctuation)
    const normalized = text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()؟?]/g, ' ')
      .replace(/\s+/g, ' ');

    const words = normalized.split(/\s+/);
    
    for (const word of words) {
      if (this.badWords.has(word)) {
        return true;
      }
    }

    // Check substring matches with word boundaries
    for (const badWord of this.badWords) {
      if (normalized.includes(badWord)) {
        const regex = new RegExp(`\\b${badWord}\\b|\\s${badWord}\\s|^${badWord}\\s|\\s${badWord}$`, 'i');
        if (regex.test(normalized)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Validates a text input and throws a BadRequestException if bad words are detected.
   */
  static validate(text: string | null | undefined, fieldName = 'الحقل'): void {
    if (this.hasBadWords(text)) {
      throw new BadRequestException(`${fieldName} يحتوي على كلمات أو عبارات غير لائقة.`);
    }
  }
}
