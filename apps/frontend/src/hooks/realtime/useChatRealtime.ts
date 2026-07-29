// apps/frontend/src/hooks/realtime/useChatRealtime.ts
"use client";

import { useEffect, useRef } from "react";
import { usePusher } from "@/context/PusherContext";

export interface ChatRealtimeHandlers {
  onMessageCreated?: (payload: any) => void;
  onUserTyping?: (payload: any) => void;
  onConversationUpdated?: (payload: any) => void;
}

export function useChatRealtime(
  conversationId: string | null | undefined,
  handlers: ChatRealtimeHandlers
) {
  const { isConnected, subscribe } = usePusher();
  const handlersRef = useRef(handlers);

  // Keep handlers ref fresh to prevent effect re-subscriptions when inline handlers are passed
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!conversationId) return;

    const channelName = `private-conversation-${conversationId}`;

    const unsubscribe = subscribe(channelName, {
      "message.created": (data: any) => handlersRef.current.onMessageCreated?.(data),
      "user.typing": (data: any) => handlersRef.current.onUserTyping?.(data),
      "conversation.updated": (data: any) => handlersRef.current.onConversationUpdated?.(data),
    });

    return () => {
      unsubscribe();
    };
  }, [conversationId, subscribe]);

  return { isConnected };
}
