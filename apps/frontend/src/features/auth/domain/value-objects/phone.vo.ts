// apps/frontend/src/features/auth/domain/value-objects/phone.vo.ts

export class EgyptianPhone {
  private readonly phone: string;

  constructor(rawPhone: string) {
    const cleanPhone = rawPhone.trim().replace(/[\s-]/g, "");
    if (!EgyptianPhone.isValid(cleanPhone)) {
      throw new Error(`Invalid Egyptian phone number: "${rawPhone}". Must be 11 digits starting with 010, 011, 012, or 015.`);
    }
    this.phone = cleanPhone;
  }

  public static isValid(phone: string): boolean {
    const regex = /^01[0125]\d{8}$/;
    return regex.test(phone);
  }

  public getValue(): string {
    return this.phone;
  }

  public getFormatted(): string {
    // Format 01X XXXX XXXX
    return `${this.phone.slice(0, 4)} ${this.phone.slice(4, 7)} ${this.phone.slice(7)}`;
  }

  public equals(other: EgyptianPhone): boolean {
    return this.phone === other.getValue();
  }
}
