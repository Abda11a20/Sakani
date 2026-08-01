// apps/backend/src/common/utils/bad-words.filter.ts

import { BadRequestException } from '@nestjs/common';

const BAD_WORDS_AR = [
  'كس',
  'شرموط',
  'قحبة',
  'خول',
  'عرص',
  'منيوك',
  'منيوكة',
  'ديوث',
  'سكس',
  'جنس',
  'بورن',
  'شذوذ',
  'شاذ',
  'لوطي',
  'سحاق',
  'زب',
  'طيز',
  'ابن الكلب',
  'احا',
  'أحا',
  'شرموطة',
  'عرصنة',
  'منيكة',
  'فاجرة',
  'عاهرة',
  'داعر',
  'عهر',
];

const BAD_WORDS_EN = [
  'fuck',
  'shit',
  'asshole',
  'bitch',
  'cunt',
  'dick',
  'pussy',
  'bastard',
  'porn',
  'sex',
  'nude',
  'slut',
  'whore',
  'faggot',
];

const SENSITIVE_PHRASES = [
  'في السر',
  'سريه تامه',
  'سرية تامة',
  'مقابل فلوس',
  'مقابل مال',
  'للتعارف',
  'واتساب فقط',
  'خاص جدا',
];

const WHITELIST_CONTEXTS = [
  'سكن',
  'شقه',
  'شقة',
  'غرفه',
  'غرفة',
  'مذاكره',
  'مذاكرة',
  'جامعه',
  'جامعة',
  'سكن طالبات',
  'زميله',
  'زميلة',
  'تجمع',
  'دراسه',
];

export class BadWordsFilter {
  /**
   * Layer 1: Text Normalization Engine
   * Strips Tashkeel, Tatweel (ـ), normalizes Alif/Yaa/Taa, collapses repeated letters.
   */
  static normalizeText(text: string | null | undefined): string {
    if (!text) return '';

    let normalized = text.toLowerCase();

    // 1. Strip Tashkeel & Tatweel
    normalized = normalized.replace(/[\u064B-\u065F\u0670\u0640]/g, '');

    // 2. Normalize Alif, Yaa, Taa Marbouta
    normalized = normalized
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه');

    // 3. Remove punctuation
    normalized = normalized
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()؟?\"'«»]/g, ' ')
      .replace(/\s+/g, ' ');

    // 4. Collapse 3+ repeated characters (e.g. عااااايز -> عايز)
    normalized = normalized.replace(/(.)\1{2,}/g, '$1');

    return normalized.trim();
  }

  /**
   * Checks if text contains whitelisted context keywords (e.g. housing, study)
   */
  static hasWhitelistedContext(normalizedText: string): boolean {
    return WHITELIST_CONTEXTS.some((w) =>
      normalizedText.includes(this.normalizeText(w)),
    );
  }

  /**
   * Checks if text violates any of the 4 safety layers.
   */
  static hasBadWords(text: string | null | undefined): boolean {
    if (!text) return false;

    const normalized = this.normalizeText(text);
    if (!normalized) return false;

    // Layer 2: Blacklist Check (Explicit Prohibited Words)
    for (const badWord of BAD_WORDS_AR.concat(BAD_WORDS_EN)) {
      const normBad = this.normalizeText(badWord);
      if (
        normalized === normBad ||
        normalized.includes(` ${normBad} `) ||
        normalized.startsWith(`${normBad} `) ||
        normalized.endsWith(` ${normBad}`)
      ) {
        return true;
      }
    }

    // Layer 3: Sensitive Phrase Check (Check if context lacks Whitelist)
    for (const phrase of SENSITIVE_PHRASES) {
      const normPhrase = this.normalizeText(phrase);
      if (normalized.includes(normPhrase)) {
        if (!this.hasWhitelistedContext(normalized)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Validates a text input and throws a BadRequestException if violation is detected.
   */
  static validate(text: string | null | undefined, fieldName = 'الحقل'): void {
    if (this.hasBadWords(text)) {
      throw new BadRequestException(
        `${fieldName} يحتوي على كلمات أو عبارات غير لائقة.`,
      );
    }
  }
}
