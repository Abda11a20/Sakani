// apps/frontend/src/features/auth/domain/value-objects/national-id.vo.ts

export class NationalId {
  private readonly nationalId: string;

  constructor(rawId: string) {
    const cleanId = rawId.trim();
    if (!NationalId.isValid(cleanId)) {
      throw new Error(`Invalid National ID length: must be 14 digits.`);
    }
    this.nationalId = cleanId;
  }

  public static isValid(nationalId: string): boolean {
    return /^\d{14}$/.test(nationalId);
  }

  public getValue(): string {
    return this.nationalId;
  }

  public getMasked(): string {
    return `${this.nationalId.slice(0, 3)}*******${this.nationalId.slice(10)}`;
  }
}
