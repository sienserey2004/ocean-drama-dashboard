
// ─── EPISODES ─────────────────────────────────────────────────────────────────

import { PaginationParams, PaginatedResponse, Episode, CreateEpisodePayload } from "@/app/types";
import api from "./client";

export const episodeApi = {
  list: (video_id: number, params?: PaginationParams) =>
    api.get<PaginatedResponse<Episode>>(`/episodes/video/${video_id}`, { params }).then(r => r.data),

  getById: (episode_id: number) =>
    api.get<Episode>(`/episodes/${episode_id}`).then(r => r.data),

  getStreamUrl: (episode_id: number) =>
    api.get<{ full_video_url: string; expires_at: string; resume_at: number }>(`/episodes/${episode_id}/stream`).then(r => r.data),

  // Issues a short-lived, episode-scoped token — required for 'full' streams.
  // Never send the user's login access_token to stream-binary: the backend
  // verifies a separate, purpose-built stream token (see stream-token.service
  // on the API), not the Firebase-derived login JWT.
  getStreamToken: (video_id: number, episode_id: number) =>
    api
      .get<{ token: string; expires_in: number }>(`/episodes/${video_id}/${episode_id}/stream-token`)
      .then(r => r.data),

  getBinaryStreamUrl: async (ep: Episode, type: 'preview' | 'full' = 'full') => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

    // Choose the right source URL
    const sourceUrl = type === 'preview' ? ep.preview_video_url : ep.full_video_url;
    if (!sourceUrl) return '';

    // Extract filename without query parameters to preserve extension (.m3u8 or .mp4)
    const cleanUrl = sourceUrl.split('?')[0];
    const fileName = cleanUrl.split('/').pop() || (sourceUrl.includes('.m3u8') ? 'master.m3u8' : 'video.mp4');

    const urlParams = new URLSearchParams();
    // 'preview' streams need no auth at all on the backend — only fetch a
    // token for 'full' streams.
    if (type === 'full') {
      const { token } = await episodeApi.getStreamToken(ep.video_id, ep.episode_id);
      urlParams.set('token', token);
    }
    const queryString = urlParams.toString() ? `?${urlParams.toString()}` : '';

    // Pattern: /api/episodes/:video_id/:episode_id/stream-binary/:type/:filename?token=...
    return `${baseUrl}/episodes/${ep.video_id}/${ep.episode_id}/stream-binary/${type}/${fileName}${queryString}`;
  },

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

  getProcessingQueue: () =>
    api.get<{ data: any[]; count: number }>('/episodes/monitoring/processing-queue').then(r => r.data),
}
