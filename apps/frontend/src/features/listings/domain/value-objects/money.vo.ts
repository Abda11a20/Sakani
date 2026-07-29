// apps/frontend/src/features/listings/domain/value-objects/money.vo.ts

export class Money {
  private readonly amount: number;
  private readonly currency: string;

  constructor(amount: number, currency = "EGP") {
    if (isNaN(amount) || amount < 0) {
      throw new Error(`Invalid monetary amount: ${amount}. Amount cannot be negative.`);
    }
    this.amount = Math.round(amount);
    this.currency = currency;
  }

  public getAmount(): number {
    return this.amount;
  }

  public getCurrency(): string {
    return this.currency;
  }

  public format(locale = "ar-EG"): string {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: this.currency,
      maximumFractionDigits: 0,
    }).format(this.amount);
  }

  public equals(other: Money): boolean {
    return this.amount === other.getAmount() && this.currency === other.getCurrency();
  }
}
