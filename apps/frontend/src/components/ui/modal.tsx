// apps/frontend/src/components/ui/modal.tsx
"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "full";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    full: "max-w-[95vw] h-[95vh]",
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-h-[90vh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] gap-3 border border-border bg-surface text-text p-4 sm:p-5 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-2xl",
            sizeClasses[size]
          )}
        >
          <div className="flex flex-col space-y-1.5 text-center sm:text-start">
            {title && (
              <Dialog.Title className="text-lg font-bold text-text leading-none tracking-tight">
                {title}
              </Dialog.Title>
            )}
            {description && (
              <Dialog.Description className="text-sm text-text-secondary">
                {description}
              </Dialog.Description>
            )}
          </div>
          <div className={cn("relative", size === "full" && "overflow-y-auto h-full")}>
            {children}
          </div>
          <Dialog.Close
            aria-label="إغلاق النافذة"
            className="absolute end-4 top-4 rounded-lg opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary disabled:pointer-events-none data-[state=open]:bg-surface-secondary data-[state=open]:text-text-secondary"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">إغلاق</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
