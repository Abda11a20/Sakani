// apps/frontend/src/features/auth/domain/value-objects/email.vo.ts

export class Email {
  private readonly value: string;

  constructor(email: string) {
    const trimmed = email.trim().toLowerCase();
    if (!Email.isValid(trimmed)) {
      throw new Error(`Invalid email address format: "${email}"`);
    }
    this.value = trimmed;
  }

  public static isValid(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: Email): boolean {
    return this.value === other.getValue();
  }
}
