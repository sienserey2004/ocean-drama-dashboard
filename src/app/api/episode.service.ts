
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

  getBinaryStreamUrl: (ep: Episode, type: 'preview' | 'full' = 'full') => {
    const token = localStorage.getItem('access_token');
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    
    // Choose the right source URL
    const sourceUrl = type === 'preview' ? ep.preview_video_url : ep.full_video_url;
    if (!sourceUrl) return '';

    // Extract filename to preserve extension (.m3u8 or .mp4)
    // The backend uses this to find the file or resolve HLS segments
    const fileName = sourceUrl.split('/').pop() || (type === 'full' ? 'index.m3u8' : 'preview.mp4');
    const urlParams = new URLSearchParams();
    if (token && token !== 'null' && token !== 'undefined') {
      urlParams.set('token', token);
    }
    const queryString = urlParams.toString() ? `?${urlParams.toString()}` : '';
    
    return `${baseUrl}/episodes/${ep.episode_id}/stream/binary/${fileName}${queryString}`;
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
}
