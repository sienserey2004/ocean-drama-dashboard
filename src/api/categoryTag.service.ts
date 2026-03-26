// ─── CATEGORIES & TAGS ────────────────────────────────────────────────────────

import { Category, Tag } from "@/types";
import api from "./client";

export const categoryApi = {
  list: () =>
    api.get<{ data: Category[] }>('/categories').then(r => r.data),

  create: (data: { name: string; description?: string }) =>
    api.post<Category>('/admin/categories', data).then(r => r.data),

  update: (id: number, data: { name: string; description?: string }) =>
    api.put(`/admin/categories/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/admin/categories/${id}`).then(r => r.data),
}

export const tagApi = {
  list: () =>
    api.get<{ data: Tag[] }>('/tags').then(r => r.data),

  create: (name: string) =>
    api.post<Tag>('/admin/tags', { name }).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/admin/tags/${id}`).then(r => r.data),
}