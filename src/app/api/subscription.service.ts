import { SubscriptionPlan } from "@/app/types";
import api from "./client";

export const subscriptionApi = {
  getPlans: () =>
    api.get<SubscriptionPlan[]>('/subscriptions/plans').then(r => r.data),

  subscribe: (planId: number, paymentMethod: string) =>
    api.post<{ message: string; subscriptionId: number }>('/subscriptions/subscribe', { planId, paymentMethod }).then(r => r.data),
};
