
// ─── EPISODES ─────────────────────────────────────────────────────────────────

import { PaginationParams, PaginatedResponse, Episode, CreateEpisodePayload } from "@/types";
import api from "./client";

export const episodeApi = {
  list: (video_id: number, params?: PaginationParams) =>
    api.get<PaginatedResponse<Episode>>(`/episodes/video/${video_id}`, { params }).then(r => r.data),

  getById: (episode_id: number) =>
    api.get<Episode>(`/episodes/${episode_id}`).then(r => r.data),

  getStreamUrl: (episode_id: number) =>
    api.get<{ full_video_url: string; expires_at: string; resume_at: number }>(`/episodes/${episode_id}/stream`).then(r => r.data),

  checkAccess: (episode_id: number) =>
    api.get<{ has_access: boolean; reason: string }>(`/episodes/${episode_id}/access`).then(r => r.data),

  create: (video_id: number, formData: FormData, onProgress?: (pct: number) => void) =>
    api.post<{ episode_id: number }>(`/videos/${video_id}/episodes`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (ev) => {
        if (onProgress && ev.total) onProgress(Math.round((ev.loaded * 100) / ev.total))
      },
    }).then(r => r.data),

  update: (episode_id: number, formData: FormData, onProgress?: (pct: number) => void) =>
    api.put(`/episodes/${episode_id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (ev) => {
        if (onProgress && ev.total) onProgress(Math.round((ev.loaded * 100) / ev.total))
      },
    }).then(r => r.data),

  delete: (episode_id: number) =>
    api.delete(`/episodes/${episode_id}`).then(r => r.data),

  saveProgress: (episode_id: number, watch_duration: number, completed: boolean) =>
    api.post(`/episodes/${episode_id}/watch`, { watch_duration, completed }).then(r => r.data),
}
