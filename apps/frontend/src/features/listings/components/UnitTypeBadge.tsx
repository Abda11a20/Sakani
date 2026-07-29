// apps/frontend/src/components/listings/UnitTypeBadge.tsx
import React from "react";
import { Badge } from "@/components/ui/badge";
import { UNIT_TYPE_CONFIG } from "@/lib/constants";
import type { UnitType } from "@/types";

interface Props {
  unitType: UnitType;
  className?: string;
}

export const UnitTypeBadge = ({ unitType, className }: Props) => {
  const config = UNIT_TYPE_CONFIG[unitType as keyof typeof UNIT_TYPE_CONFIG];
  if (!config) return null;

  return (
    <Badge variant="info" className={className}>
      {config.labelAr}
    </Badge>
  );
};

export default UnitTypeBadge;
