// apps/frontend/src/features/search/index.ts
/**
 * Search Feature — Public API Barrel Export (Clean Architecture)
 */
export * from "./domain/repositories/search.repository";
export * from "./domain/usecases/search-listings.usecase";
export * from "./infrastructure/repositories/axios-search.repository";
export * from "./services/search.service";
export * from "./components/ActiveFilterChips";
export * from "./components/SearchFilterControls";
export * from "./components/SearchFilterDrawer";
export * from "./components/SearchFilterSidebar";
export * from "./components/SearchHeader";
export * from "./components/SearchListingCardWrapper";
export * from "./components/SearchPagination";
export * from "./components/SearchResultsGrid";
