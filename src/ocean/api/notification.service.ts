// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

import { PaginatedResponse, Notification } from "@/ocean/types";
import api from "./client";

export const notificationApi = {
  list: (params?: { page?: number; limit?: number; is_read?: boolean }) =>
    api.get<PaginatedResponse<Notification> & { unread_count: number }>('/notifications', { params }).then(r => r.data),

  unreadCount: () =>
    api.get<{ unread_count: number }>('/notifications/unread-count').then(r => r.data),

  markRead: (id: number) =>
    api.patch(`/notifications/${id}/read`).then(r => r.data),

  markAllRead: () =>
    api.patch('/notifications/read-all').then(r => r.data),

  delete: (id: number) =>
    api.delete(`/notifications/${id}`).then(r => r.data),

  broadcast: (data: { title: string; message: string; type: string }) =>
    api.post<{ sent_count: number }>('/admin/notifications/broadcast', data).then(r => r.data),

  sendToUser: (data: { user_id: number; title: string; message: string; type: string }) =>
    api.post('/admin/notifications/send', data).then(r => r.data),
}
