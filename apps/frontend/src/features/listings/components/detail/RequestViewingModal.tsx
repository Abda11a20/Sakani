// apps/frontend/src/components/listings/detail/RequestViewingModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle, Calendar, Clock } from "lucide-react";
import { Button, Input, Select, Modal } from "@/components/ui";

interface RequestViewingModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  onSubmit: (date: string, time: string) => Promise<void>;
}

const TIME_OPTIONS = [
  { value: "10:00 AM", label: "10:00 صباحاً" },
  { value: "12:00 PM", label: "12:00 ظهراً" },
  { value: "02:00 PM", label: "02:00 عصراً" },
  { value: "04:00 PM", label: "04:00 عصراً" },
  { value: "06:00 PM", label: "06:00 مساءً" },
  { value: "08:00 PM", label: "08:00 مساءً" },
];

export function RequestViewingModal({
  isOpen,
  open,
  onClose,
  onSubmit,
}: RequestViewingModalProps) {
  const isModalOpen = Boolean(isOpen ?? open);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("04:00 PM");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow.toISOString().split("T")[0]);
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    setLoading(true);
    try {
      await onSubmit(date, time);
      setSuccess(true);
    } catch {
      // Handled by parent Toast
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSuccess(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={handleCloseModal}
      title="طلب معاينة العقار"
      description="اختر الموعد والوقت المناسبين لمعاينة العقار"
    >
      {success ? (
        <div className="text-center py-4">
          <CheckCircle size={40} className="text-status-success mx-auto mb-3" aria-hidden="true" />
          <h3 className="text-base font-bold text-text mb-1.5">
            تم إرسال طلبك بنجاح!
          </h3>
          <p className="text-text-secondary text-xs mb-5">
            سيتواصل معك المؤجر في أقرب وقت لتنسيق الموعد وتأكيده.
          </p>
          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            onClick={handleCloseModal}
          >
            حسناً
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs pt-2">
          <Input
            type="date"
            label="تاريخ المعاينة"
            value={date}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDate(e.target.value)}
            required
            leftIcon={<Calendar size={14} />}
          />

          <Select
            label="وقت المعاينة المفصل"
            value={time}
            onValueChange={setTime}
            options={TIME_OPTIONS}
          />

          <div className="flex gap-2.5 pt-3 border-t border-divider">
            <Button
              type="button"
              variant="outline"
              size="md"
              fullWidth
              onClick={handleCloseModal}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              disabled={loading || !date}
              loading={loading}
            >
              إرسال الطلب
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
