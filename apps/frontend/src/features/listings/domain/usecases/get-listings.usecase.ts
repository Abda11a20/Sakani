// apps/frontend/src/features/listings/domain/usecases/get-listings.usecase.ts
import { IListingRepository } from "../repositories/listing.repository";
import { ListingEntity } from "../entities/listing.entity";

export class GetListingsUseCase {
  constructor(private readonly repo: IListingRepository) {}

  async execute(params?: Record<string, unknown>): Promise<{ listings: ListingEntity[]; total: number }> {
    return await this.repo.getAll(params);
  }
}

export class GetListingByIdUseCase {
  constructor(private readonly repo: IListingRepository) {}

  async execute(id: string): Promise<ListingEntity | null> {
    if (!id) throw new Error("Listing ID is required.");
    return await this.repo.getOne(id);
  }
}

export class CreateListingUseCase {
  constructor(private readonly repo: IListingRepository) {}

  async execute(data: Record<string, unknown>): Promise<ListingEntity> {
    if (!data.title || !data.price || !data.unitType) {
      throw new Error("Missing required fields for listing creation.");
    }
    return await this.repo.create(data);
  }
}
