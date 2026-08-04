'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface CampaignToolbarProps {
  onOpenCreateAd: () => void;
}

export function CampaignToolbar({ onOpenCreateAd }: CampaignToolbarProps) {
  return (
    <div className="flex items-center justify-between font-cairo">
      <p className="text-xs text-text-secondary font-medium">
        اضغط على أي حملة تفاعلية لإظهار وتعديل الإعلانات التابعة لها
      </p>
      <Button
        variant="primary"
        size="sm"
        leftIcon={<Plus size={14} />}
        onClick={onOpenCreateAd}
      >
        إضافة إعلان جديد
      </Button>
    </div>
  );
}
