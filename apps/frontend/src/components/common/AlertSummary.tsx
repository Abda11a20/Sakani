// apps/frontend/src/components/common/AlertSummary.tsx
import React from "react";
import { generateAlertSummary } from "@/lib/helpers";
import type { Alert } from "@/types";

interface AlertSummaryProps {
  alert: Alert;
  className?: string;
}

export const AlertSummary = ({ alert, className }: AlertSummaryProps) => (
  <span className={className ?? "text-sm font-medium text-foreground"}>
    {generateAlertSummary(alert)}
  </span>
);

export default AlertSummary;
