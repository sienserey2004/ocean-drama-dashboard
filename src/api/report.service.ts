// ─── REPORTS ──────────────────────────────────────────────────────────────────

import { PaginatedResponse, Report } from "@/types";
import api from "./client";

export const reportApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<PaginatedResponse<Report>>('/admin/reports', { params }).then(r => r.data),

  update: (report_id: number, status: string, admin_note?: string) =>
    api.patch(`/admin/reports/${report_id}`, { status, admin_note }).then(r => r.data),

  deleteComment: (comment_id: number) =>
    api.delete(`/admin/comments/${comment_id}`).then(r => r.data),
}