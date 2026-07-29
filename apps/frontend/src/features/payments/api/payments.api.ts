// apps/frontend/src/lib/api/payments.api.ts
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

export const paymentsApi = {
  getPlan: async () => {
    const res = await api.get<PlanResult>("/payments/plan");
    return res.data;
  },

  initiate: async (data: InitiatePaymentPayload) => {
    const res = await api.post<{ paymentUrl: string }>("/payments/initiate", data);
    return res.data;
  },

  getHistory: async () => {
    const res = await api.get<SubscriptionHistoryItem[]>("/payments/history");
    return res.data;
  },

  cancelSubscription: async () => {
    const res = await api.delete<{ success: boolean; message: string }>("/payments/subscription");
    return res.data;
  },
};
