// apps/frontend/src/components/listings/detail/RequestViewingModal.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { CheckCircle, Calendar, Clock } from "lucide-react";
import { Button, Modal } from "@/components/ui";

interface RequestViewingModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  onSubmit: (date: string, time: string) => Promise<void>;
}

const HOURS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export function RequestViewingModal({
  isOpen,
  open,
  onClose,
  onSubmit,
}: RequestViewingModalProps) {
  const isModalOpen = Boolean(isOpen ?? open);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState("");
  const [selectedHour, setSelectedHour] = useState("4");
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">("PM");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow.toISOString().split("T")[0]);
      setSuccess(false);
    }
  }, [isModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    // Convert 1-12 AM/PM into 24-hour string (HH:mm:ss) for clean Date constructor compatibility
    let h = parseInt(selectedHour, 10);
    if (selectedPeriod === "PM" && h < 12) h += 12;
    if (selectedPeriod === "AM" && h === 12) h = 0;
    const timeFormatted = `${h.toString().padStart(2, "0")}:00:00`;

    setLoading(true);
    try {
      await onSubmit(date, timeFormatted);
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
        <div className="text-center py-6 px-2 space-y-4 font-cairo">
          <div className="w-16 h-16 bg-status-success/15 text-status-success border border-status-success/30 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle size={36} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-text">
              تم إرسال طلب المعاينة بنجاح!
            </h3>
            <p className="text-text-secondary text-xs leading-relaxed max-w-xs mx-auto">
              سيتواصل معك المؤجر فور مراجعة الطلب لتنسيق الموعد وتأكيده.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleCloseModal}
            className="rounded-xl py-3 text-xs font-bold shadow-xs bg-primary hover:bg-primary-hover text-white"
          >
            حسناً، إغلاق
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-cairo pt-1">
          {/* Section 1: Viewing Date Box */}
          <div
            onClick={() => {
              try {
                dateInputRef.current?.showPicker?.();
              } catch {
                dateInputRef.current?.focus();
              }
            }}
            className="bg-slate-50/80 border border-slate-200/80 p-3.5 rounded-2xl space-y-2 cursor-pointer hover:border-[#1B4F8A]/40 transition-colors"
          >
            <label className="flex items-center gap-1.5 font-bold text-slate-800 text-xs pointer-events-none">
              <Calendar size={18} className="text-[#1B4F8A]" />
              <span>تاريخ المعاينة</span>
            </label>
            <div className="relative">
              <input
                ref={dateInputRef}
                type="date"
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
                onClick={(e) => {
                  try {
                    (e.target as HTMLInputElement).showPicker?.();
                  } catch {}
                }}
                required
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30 focus:border-[#1B4F8A] transition-all shadow-xs cursor-pointer"
              />
            </div>
          </div>

          {/* Section 2: Viewing Time (Hour 1-12 + Period ص / م) */}
          <div className="bg-slate-50/80 border border-slate-200/80 p-3.5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                <Clock size={14} className="text-[#1B4F8A]" />
                <span>وقت المعاينة المفضّل</span>
              </label>

              {/* AM / PM Period Toggle */}
              <div className="flex items-center p-1 bg-slate-200/70 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedPeriod("AM")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedPeriod === "AM"
                      ? "bg-[#1B4F8A] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  صباحاً
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPeriod("PM")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedPeriod === "PM"
                      ? "bg-[#1B4F8A] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  مساءً
                </button>
              </div>
            </div>

            {/* 1 to 12 Hours Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 pt-1">
              {HOURS.map((hr) => {
                const isSelected = selectedHour === hr;
                return (
                  <button
                    key={hr}
                    type="button"
                    onClick={() => setSelectedHour(hr)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex flex-col items-center justify-center ${
                      isSelected
                        ? "bg-[#1B4F8A] text-white border-[#1B4F8A] shadow-xs scale-[1.03]"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100/60"
                    }`}
                  >
                    <span>الساعة {hr}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Action Buttons */}
          <div className="flex gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              fullWidth
              onClick={handleCloseModal}
              className="rounded-xl py-3 text-xs font-semibold text-slate-600 border-slate-200 hover:bg-slate-50"
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
              className="rounded-xl py-3 text-xs font-bold bg-[#1B4F8A] hover:bg-[#153e6d] text-white shadow-xs"
            >
              إرسال الطلب
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}


