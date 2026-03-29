// ─── VIDEOS ───────────────────────────────────────────────────────────────────

import { PaginatedResponse, Video, CreateVideoPayload, UpdateVideoPayload, PaginationParams } from "@/types";
import api from "./client";

export interface FeedPreviewItem {
  episodeId: number;
  previewVideoUrl: string;
  video: {
    videoId: number;
    title: string;
    thumbnailUrl: string;
    is_free: boolean;
    price: number;
    creator: {
      name: string;
    };
  };
}

export interface FeedPreviewResponse {
  data: FeedPreviewItem[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export const videoApi = {
  list: (params?: { page?: number; limit?: number; category?: string; sort?: string; tag?: string; creator_id?: number }) =>
    api.get<PaginatedResponse<Video>>('/videos', { params }).then(r => r.data),

  search: (params: { q: string; category?: string; tag?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Video>>('/videos/search', { params }).then(r => r.data),

  trending: (params?: { limit?: number; period?: string }) =>
    api.get<{ data: Video[] }>('/videos/trending', { params }).then(r => r.data),

  recommended: (params?: { limit?: number }) =>
    api.get<{ data: Video[] }>('/videos/recommended', { params }).then(r => r.data),

  getById: (video_id: number) =>
    api.get<Video>(`/videos/${video_id}`).then(r => r.data),
    

  create: (data: CreateVideoPayload) =>
    api.post<{ video_id: number; status: string; message: string }>('/videos', data).then(r => r.data),

  createMultipart: (formData: FormData) =>
    api.post<{
      video_id: number;
      title: string;
      status: "pending";
      message: string;
      creator_id: number;
      created_at: string;
    }>('/videos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),

  update: (video_id: number, formData: FormData, onProgress?: (pct: number) => void) =>
    api.put(`/videos/${video_id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (ev) => {
        if (onProgress && ev.total) onProgress(Math.round((ev.loaded * 100) / ev.total))
      },
    }).then(r => r.data),

  delete: (video_id: number) =>
    api.delete(`/videos/${video_id}`).then(r => r.data),

  recordView: (video_id: number) =>
    api.post(`/videos/${video_id}/view`, { user_id: null }).then(r => r.data),

  share: (video_id: number, platform: string) =>
    api.post(`/videos/${video_id}/share`, { share_platform: platform }).then(r => r.data),

  report: (video_id: number, reason: string) =>
    api.post(`/videos/${video_id}/report`, { reason }).then(r => r.data),

  like: (video_id: number) =>
    api.post(`/videos/${video_id}/like`).then(r => r.data),

  unlike: (video_id: number) =>
    api.delete(`/videos/${video_id}/like`).then(r => r.data),

  getLikes: (video_id: number) =>
    api.get<{ like_count: number; user_liked: boolean }>(`/videos/${video_id}/likes`).then(r => r.data),

  getComments: (video_id: number, params?: PaginationParams) =>
    api.get<PaginatedResponse<any>>(`/videos/${video_id}/comments`, { params }).then(r => r.data),

  addComment: (video_id: number, comment_text: string) =>
    api.post(`/videos/${video_id}/comments`, { comment_text }).then(r => r.data),

  updateComment: (comment_id: number, comment_text: string) =>
    api.put(`/comments/${comment_id}`, { comment_text }).then(r => r.data),

  deleteComment: (comment_id: number) =>
    api.delete(`/comments/${comment_id}`).then(r => r.data),

  addFavorite: (video_id: number) =>
    api.post(`/videos/${video_id}/favorite`).then(r => r.data),

  removeFavorite: (video_id: number) =>
    api.delete(`/videos/${video_id}/favorite`).then(r => r.data),

  feedPreview: (params?: { limit?: number; offset?: number }) =>
    api.get<FeedPreviewResponse>('/feed/preview', { params }).then(r => r.data),
}
