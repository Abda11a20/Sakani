// apps/frontend/src/components/listings/ListingStatusBadge.tsx
import React from "react";
import { Badge } from "@/components/ui/badge";
import { LISTING_STATUS_CONFIG } from "@/lib/constants";
import type { ListingStatus } from "@/types";
import type { BadgeColor } from "@/components/ui/badge";

interface Props {
  status: ListingStatus;
  className?: string;
}

export const ListingStatusBadge = ({ status, className }: Props) => {
  const config = LISTING_STATUS_CONFIG[status as keyof typeof LISTING_STATUS_CONFIG];
  if (!config) return null;

  return (
    <Badge color={config.color as BadgeColor} className={className}>
      {config.labelAr}
    </Badge>
  );
};

export default ListingStatusBadge;
