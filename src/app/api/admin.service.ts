// ─── ADMIN VIDEO MANAGEMENT ───────────────────────────────────────────────────

import { AnalyticsOverview, DeviceSession, PaginatedResponse, RevenueData, TopVideo, Video, User } from "@/app/types";
import api from "./client";

export const adminUserApi = {
  list: (params?: { page?: number; limit?: number; role?: string; status?: string; search?: string }) =>
    api.get<PaginatedResponse<User>>('/admin/users', { params }).then(r => r.data),

  getById: (user_id: number) =>
    api.get<User>(`/admin/users/${user_id}`).then(r => r.data),

  changeRole: (user_id: number, role: string) =>
    api.patch(`/admin/users/${user_id}/role`, { role }).then(r => r.data),

  changeStatus: (user_id: number, status: string, reason?: string) =>
    api.patch(`/admin/users/${user_id}/status`, { status, reason }).then(r => r.data),

  delete: (user_id: number) =>
    api.delete(`/admin/users/${user_id}`).then(r => r.data),
}

export const adminVideoApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<PaginatedResponse<Video>>('/admin/videos', { params }).then(r => r.data),

  approve: (video_id: number) =>
    api.patch(`/admin/videos/${video_id}/approve`).then(r => r.data),

  reject: (video_id: number, reject_reason: string) =>
    api.patch(`/admin/videos/${video_id}/reject`, { reject_reason }).then(r => r.data),

  forceDelete: (video_id: number) =>
    api.delete(`/admin/videos/${video_id}`).then(r => r.data),
}


// ─── ADMIN ANALYTICS ─────────────────────────────────────────────────────────

export const analyticsApi = {
  overview: (params?: { from?: string; to?: string }) =>
    api.get<AnalyticsOverview>('/admin/analytics/overview', { params }).then(r => r.data),

  revenue: (params?: { period?: string; year?: number }) =>
    api.get<{ data: RevenueData[] }>('/admin/analytics/revenue', { params }).then(r => r.data),

  topVideos: (params?: { sort?: string; limit?: number }) =>
    api.get<{ data: TopVideo[] }>('/admin/analytics/videos', { params }).then(r => r.data),
}

// ─── SESSION ──────────────────────────────────────────────────────────────────

export const sessionApi = {
  getCurrent: () =>
    api.get<DeviceSession>('/sessions/current').then(r => r.data),

  logout: () =>
    api.delete('/sessions/current').then(r => r.data),
}
