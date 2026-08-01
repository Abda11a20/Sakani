"use client";

import React from "react";
import { Send, Loader2 } from "lucide-react";

interface AdminChatSendButtonProps {
  disabled?: boolean;
  isSending?: boolean;
}

export const AdminChatSendButton: React.FC<AdminChatSendButtonProps> = ({
  disabled,
  isSending,
}) => {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl flex items-center gap-2 disabled:opacity-40 shrink-0 transition-all shadow-sm cursor-pointer"
    >
      {isSending ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <>
          <span>إرسال</span>
          <Send size={16} />
        </>
      )}
    </button>
  );
};
