import api from "./client";
import { PlatformOverview, PlatformRevenueTrend, PlatformTopVideo } from "@/ocean/types";

export const adminAnalyticsApi = {
  getOverview: (params?: { from?: string; to?: string }) =>
    api.get<PlatformOverview>('/admin/analytics/overview', { params }).then(r => r.data),

  getRevenue: (params?: { period?: string; year?: number }) =>
    api.get<{ data: PlatformRevenueTrend[] }>('/admin/analytics/revenue', { params }).then(r => r.data),

  getTopVideos: (params?: { sort?: 'views' | 'revenue'; limit?: number }) =>
    api.get<{ data: PlatformTopVideo[] }>('/admin/analytics/videos', { params }).then(r => r.data),
};
