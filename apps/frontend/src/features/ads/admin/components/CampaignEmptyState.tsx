'use client';

import React from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { Megaphone } from 'lucide-react';

export function CampaignEmptyState() {
  return (
    <EmptyState
      title="لا توجد حملات إعلانية"
      description="اضغط على زر إنشاء حملة جديدة في الأعلى للبدء بإضافة البيانات"
      icon={<Megaphone className="h-10 w-10 text-text-tertiary" />}
    />
  );
}
