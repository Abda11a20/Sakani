// apps/frontend/src/hooks/useSubscription.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface PlanResult {
  plan: "free" | "premium";
  status: "active" | "inactive";
  mock?: boolean;
  id?: string;
  expiresAt?: string;
  createdAt?: string;
}

export interface InitiatePaymentPayload {
  plan: "free" | "premium";
  billingPhone: string;
  billingName: string;
}

export interface SubscriptionHistoryItem {
  id: string;
  plan: string;
  amount: number;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export const useCurrentPlan = () => {
  return useQuery<PlanResult>({
    queryKey: ["payments", "plan"],
    queryFn: async (): Promise<PlanResult> => {
      const response = await api.get<PlanResult>("/payments/plan");
      return response.data;
    },
  });
};

export const useInitiatePayment = () => {
  return useMutation<{ paymentUrl: string }, Error, InitiatePaymentPayload>({
    mutationFn: async (data): Promise<{ paymentUrl: string }> => {
      const response = await api.post<{ paymentUrl: string }>("/payments/initiate", data);
      return response.data;
    },
  });
};

export const useSubscriptionHistory = () => {
  return useQuery<SubscriptionHistoryItem[]>({
    queryKey: ["payments", "history"],
    queryFn: async (): Promise<SubscriptionHistoryItem[]> => {
      const response = await api.get<SubscriptionHistoryItem[]>("/payments/history");
      return response.data;
    },
  });
};

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string }, Error, void>({
    mutationFn: async (): Promise<{ success: boolean; message: string }> => {
      const response = await api.delete<{ success: boolean; message: string }>("/payments/subscription");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", "plan"] });
    },
  });
};
