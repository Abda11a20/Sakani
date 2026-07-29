// apps/frontend/src/features/listings/domain/entities/listing.entity.ts

export type ListingUnitType = "apartment" | "villa" | "studio" | "room" | "bed";
export type ListingGenderTarget = "male" | "female" | "family" | "any";
export type ListingStatusType = "active" | "pending" | "rejected" | "rented" | "archived" | "draft" | "pending_review" | "paused";

export interface ListingProps {
  id: string;
  title: string;
  description?: string;
  price: number;
  unitType: ListingUnitType;
  genderTarget: ListingGenderTarget;
  governorate: string;
  district: string;
  address?: string;
  images: string[];
  isFurnished?: boolean;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  availableBeds?: number;
  totalBeds?: number;
  status: ListingStatusType;
  viewsCount?: number;
  landlordId: string;
  createdAt: string;
  updatedAt: string;
  archivedReason?: string;
}

export class ListingEntity {
  private props: ListingProps;

  constructor(props: ListingProps) {
    this.props = { ...props };
  }

  public get id(): string { return this.props.id; }
  public get title(): string { return this.props.title; }
  public get price(): number { return this.props.price; }
  public get unitType(): ListingUnitType { return this.props.unitType; }
  public get genderTarget(): ListingGenderTarget { return this.props.genderTarget; }
  public get governorate(): string { return this.props.governorate; }
  public get district(): string { return this.props.district; }
  public get images(): string[] { return this.props.images || []; }
  public get status(): ListingStatusType { return this.props.status; }
  public get landlordId(): string { return this.props.landlordId; }

  /**
   * Business Invariant: Active listing availability check
   */
  public isAvailable(): boolean {
    return this.props.status === "active";
  }

  /**
   * Business Invariant: Shared bed unit check
   */
  public isSharedBed(): boolean {
    return this.props.unitType === "bed" || (this.props.totalBeds ?? 0) > 1;
  }

  /**
   * Business Invariant: Calculate cost per bed
   */
  public getPricePerBed(): number {
    if (this.props.totalBeds && this.props.totalBeds > 0) {
      return Math.round(this.props.price / this.props.totalBeds);
    }
    return this.props.price;
  }

  /**
   * Business Rule: Publish listing state transition
   */
  public publish(): void {
    if (!this.props.title || this.props.title.trim().length < 5) {
      throw new Error("Cannot publish listing: Title must be at least 5 characters long.");
    }
    if (this.props.price <= 0) {
      throw new Error("Cannot publish listing: Price must be greater than zero.");
    }
    this.props.status = "active";
    this.props.updatedAt = new Date().toISOString();
  }

  /**
   * Business Rule: Archive listing with optional reason
   */
  public archive(reason?: string): void {
    this.props.status = "archived";
    if (reason) {
      this.props.archivedReason = reason;
    }
    this.props.updatedAt = new Date().toISOString();
  }

  /**
   * Business Rule: Check if tenant gender matches listing target
   */
  public canBeRentedBy(tenantGender: "male" | "female"): boolean {
    if (this.props.genderTarget === "any" || this.props.genderTarget === "family") return true;
    return this.props.genderTarget === tenantGender;
  }

  public toJSON(): ListingProps {
    return { ...this.props };
  }
}
