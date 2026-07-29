// apps/frontend/src/components/search/SearchListingCardWrapper.tsx
"use client";

import React from "react";
import { useMatchingAlert } from "@/hooks/useAlertMatching";
import { ListingCard } from "@/features/listings";
import type { Listing } from "@/types";

interface SearchListingCardWrapperProps {
  listing: Listing;
  isAuthenticated: boolean;
}

export function SearchListingCardWrapper({ listing, isAuthenticated }: SearchListingCardWrapperProps) {
  if (isAuthenticated) {
    return <AuthenticatedSearchListingCard listing={listing} />;
  }

  return <ListingCard listing={listing} />;
}

function AuthenticatedSearchListingCard({ listing }: { listing: Listing }) {
  const matchingAlert = useMatchingAlert(listing);
  return <ListingCard listing={listing} matchingAlert={matchingAlert} />;
}
