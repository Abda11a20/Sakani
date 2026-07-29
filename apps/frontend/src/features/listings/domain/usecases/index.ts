// apps/frontend/src/features/listings/domain/usecases/index.ts
import { listingRepository } from "../../infrastructure/repositories/axios-listing.repository";
import { GetListingsUseCase, GetListingByIdUseCase, CreateListingUseCase } from "./get-listings.usecase";

export * from "./get-listings.usecase";

export const getListingsUseCase = new GetListingsUseCase(listingRepository);
export const getListingByIdUseCase = new GetListingByIdUseCase(listingRepository);
export const createListingUseCase = new CreateListingUseCase(listingRepository);
