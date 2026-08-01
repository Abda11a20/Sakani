// apps/frontend/src/components/ui/empty-state.tsx
import React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-tertiary text-text-tertiary">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold text-text">
        {title}
      </h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-text-secondary">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};
