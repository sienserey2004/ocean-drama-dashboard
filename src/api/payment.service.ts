// ─── PAYMENTS ─────────────────────────────────────────────────────────────────

import { Payment, PaginationParams, PaginatedResponse, EarningsSummary, CreatorEarning } from "@/types";
import api from "./client";

export const paymentApi = {
  initiate: (data: { amount: number; currency?: string; video_id: number }) =>
    api.post<{ payment_id: string; transaction_id: string; qr_code: string; qr_string?: string; expires_at: string; status: string }>('/payment/initiate', data).then(r => r.data),

  verify: (transaction_id: string) =>
    api.post<{ payment_id: string; status: string; amount: string; purchase_id: number }>('/payment/verify', { transaction_id }).then(r => r.data),

  history: (params?: PaginationParams) =>
    api.get<PaginatedResponse<Payment>>('/payments/history', { params }).then(r => r.data),

  purchase: (video_id: number, payment_id: number) =>
    api.post<{ purchase_id: number; access_granted: boolean }>(`/episodes/${video_id}/purchase`, { payment_id }).then(r => r.data),

  getEarnings: (params?: { from?: string; to?: string }) =>
    api.get<EarningsSummary>('/creator/earnings', { params }).then(r => r.data),

  getEarningsBreakdown: (params?: PaginationParams) =>
    api.get<PaginatedResponse<CreatorEarning>>('/creator/earnings/breakdown', { params }).then(r => r.data),
}
