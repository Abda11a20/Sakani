// apps/frontend/src/components/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth.store";

// Toaster من Radix Toast
import { Toaster } from "@/components/ui/toaster";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  // نُنشئ QueryClient مرة واحدة لكل component instance
  const queryClientRef = useRef<QueryClient | null>(null);
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // دقيقة
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    });
  }

  // استعادة بيانات المستخدم من localStorage عند بدء التطبيق
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <QueryClientProvider client={queryClientRef.current}>
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
