import { SubscriptionPlan, UserSubscription } from "@/app/types";
import api from "./client";

export const subscriptionApi = {
  getPlans: () =>
    api.get<SubscriptionPlan[]>('/subscriptions/plans').then(r => r.data),

  getMySubscription: () =>
    api.get<UserSubscription>('/subscriptions/my').then(r => r.data),

  subscribe: (plan_id: number, provider: string) =>
    api.post<{ 
      subscription: any; 
      transaction: any; 
      qr_code: string; 
      transaction_id: string; 
      expires_at: string 
    }>('/subscriptions/subscribe', { plan_id, provider }).then(r => r.data),

  verify: (transaction_id: string) =>
    api.post<{ status: string; subscription?: any }>('/subscriptions/verify', { transaction_id }).then(r => r.data),
};
