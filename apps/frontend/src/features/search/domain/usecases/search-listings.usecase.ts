// apps/frontend/src/features/search/domain/usecases/search-listings.usecase.ts
import { searchRepository } from "../../infrastructure/repositories/axios-search.repository";
import { ISearchRepository, SearchResult } from "../repositories/search.repository";

export class SearchListingsUseCase {
  constructor(private readonly searchRepo: ISearchRepository) {}

  async execute(filters: Record<string, unknown>, page = 1, limit = 12): Promise<SearchResult> {
    return await this.searchRepo.searchListings(filters, page, limit);
  }
}

export const searchListingsUseCase = new SearchListingsUseCase(searchRepository);
