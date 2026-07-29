// apps/frontend/src/hooks/useSubscription.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  paymentsApi,
  type PlanResult,
  type InitiatePaymentPayload,
  type SubscriptionHistoryItem,
} from "@/features/payments";

export type { PlanResult, InitiatePaymentPayload, SubscriptionHistoryItem };

export const useCurrentPlan = () => {
  return useQuery<PlanResult>({
    queryKey: ["payments", "plan"],
    queryFn: () => paymentsApi.getPlan(),
  });
};

export const useInitiatePayment = () => {
  return useMutation<{ paymentUrl: string }, Error, InitiatePaymentPayload>({
    mutationFn: (data) => paymentsApi.initiate(data),
  });
};

export const useSubscriptionHistory = () => {
  return useQuery<SubscriptionHistoryItem[]>({
    queryKey: ["payments", "history"],
    queryFn: () => paymentsApi.getHistory(),
  });
};

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string }, Error, void>({
    mutationFn: () => paymentsApi.cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", "plan"] });
    },
  });
};
