import React from 'react';
import { Card } from '@/components/ui/card';

export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-5 space-y-2 animate-pulse">
          <div className="h-3 w-24 bg-surface-tertiary rounded" />
          <div className="h-7 w-20 bg-surface-tertiary rounded" />
          <div className="h-2.5 w-16 bg-surface-tertiary rounded" />
        </Card>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 w-full bg-surface-tertiary rounded-xl" />
      ))}
    </div>
  );
}
