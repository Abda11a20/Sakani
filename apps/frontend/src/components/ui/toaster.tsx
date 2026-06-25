// apps/frontend/src/components/ui/toaster.tsx
"use client";

import * as Toast from "@radix-ui/react-toast";
import { X } from "lucide-react";
import { create } from "zustand";
import { cn } from "@/lib/utils";

// ── Store للـ toasts ──
type ToastVariant = "default" | "success" | "error" | "warning";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: Math.random().toString(36).slice(2) },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

// ── Helper function للاستخدام من أي مكان ──
export function toast(options: Omit<ToastItem, "id">) {
  useToastStore.getState().addToast(options);
}

// ── Toaster Component ──
const variantStyles: Record<ToastVariant, string> = {
  default: "border-border bg-card text-foreground",
  success: "border-green-500 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300",
  error: "border-red-500 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300",
  warning: "border-yellow-500 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
};

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  return (
    <Toast.Provider swipeDirection="right" duration={4000}>
      {toasts.map((toastItem) => (
        <Toast.Root
          key={toastItem.id}
          open={true}
          onOpenChange={(open) => {
            if (!open) removeToast(toastItem.id);
          }}
          className={cn(
            "flex items-start gap-3 rounded-xl border p-4 shadow-lg",
            "data-[state=open]:animate-fade-in-up",
            "data-[state=closed]:opacity-0 transition-opacity",
            variantStyles[toastItem.variant ?? "default"]
          )}
        >
          <div className="flex-1 min-w-0">
            <Toast.Title className="text-sm font-semibold leading-tight">
              {toastItem.title}
            </Toast.Title>
            {toastItem.description && (
              <Toast.Description className="mt-1 text-xs opacity-80">
                {toastItem.description}
              </Toast.Description>
            )}
          </div>
          <Toast.Close
            className="shrink-0 rounded-md p-1 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="إغلاق"
          >
            <X size={14} />
          </Toast.Close>
        </Toast.Root>
      ))}

      <Toast.Viewport
        className={cn(
          "fixed z-[100] flex flex-col gap-2 p-4",
          "bottom-4 end-4", // يدعم RTL تلقائياً مع end-4
          "w-full max-w-sm"
        )}
      />
    </Toast.Provider>
  );
}
