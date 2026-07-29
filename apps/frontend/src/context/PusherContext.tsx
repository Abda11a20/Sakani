// apps/frontend/src/context/PusherContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import Pusher, { Channel } from "pusher-js";
import { useAuthStore } from "@/features/auth";

type EventHandler = (data: any) => void;

interface ChannelEntry {
  channel: Channel;
  refCount: number;
}

interface PusherContextType {
  isConnected: boolean;
  subscribe: (channelName: string, events: Record<string, EventHandler>) => () => void;
}

const PusherContext = createContext<PusherContextType | null>(null);

export function PusherProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const pusherRef = useRef<Pusher | null>(null);
  const registryRef = useRef<Map<string, ChannelEntry>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  // Maintain singleton Pusher connection per authenticated session
  useEffect(() => {
    if (!token || !user) {
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
        registryRef.current.clear();
        setIsConnected(false);
      }
      return;
    }

    if (pusherRef.current) return;

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY ?? "";
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "eu";
    const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      authEndpoint: `${backendUrl}/chat/pusher/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    pusher.connection.bind("connected", () => setIsConnected(true));
    pusher.connection.bind("disconnected", () => setIsConnected(false));
    pusher.connection.bind("error", () => setIsConnected(false));

    pusherRef.current = pusher;

    return () => {
      pusher.disconnect();
      pusherRef.current = null;
      registryRef.current.clear();
      setIsConnected(false);
    };
  }, [token, user]);

  const subscribe = useCallback(
    (channelName: string, events: Record<string, EventHandler>) => {
      if (!pusherRef.current || !token) {
        return () => {};
      }

      const pusher = pusherRef.current;
      let entry = registryRef.current.get(channelName);

      if (!entry) {
        const channel = pusher.subscribe(channelName);
        entry = { channel, refCount: 1 };
        registryRef.current.set(channelName, entry);
      } else {
        entry.refCount += 1;
      }

      const channel = entry.channel;

      // Bind consumer handlers
      Object.entries(events).forEach(([eventName, handler]) => {
        channel.bind(eventName, handler);
      });

      // Cleanup function for specific consumer
      return () => {
        Object.entries(events).forEach(([eventName, handler]) => {
          channel.unbind(eventName, handler);
        });

        const currentEntry = registryRef.current.get(channelName);
        if (currentEntry) {
          currentEntry.refCount -= 1;
          if (currentEntry.refCount <= 0) {
            channel.unbind_all();
            pusher.unsubscribe(channelName);
            registryRef.current.delete(channelName);
          }
        }
      };
    },
    [token]
  );

  return (
    <PusherContext.Provider value={{ isConnected, subscribe }}>
      {children}
    </PusherContext.Provider>
  );
}

export function usePusher() {
  const context = useContext(PusherContext);
  if (!context) {
    throw new Error("usePusher must be used within a PusherProvider");
  }
  return context;
}
