import api from "./client";

export interface Comment {
  comment_id: number;
  user_id: number;
  video_id?: number;
  episode_id?: number;
  parent_id?: number;
  text: string;
  created_at: string;
  user?: string;
  user_image?: string;
  reply_count?: number;
}

export const commentApi = {
  listByVideo: (videoId: number, params: { page?: number; limit?: number } = {}) =>
    api.get<{ data: Comment[]; total: number; page: number; limit: number }>(`/videos/${videoId}/comments`, { params }).then(r => r.data),

  listByEpisode: (episodeId: number, params: { page?: number; limit?: number } = {}) =>
    api.get<{ data: Comment[]; total: number; page: number; limit: number }>(`/episodes/${episodeId}/comments`, { params }).then(r => r.data),

  listReplies: (commentId: number, params: { page?: number; limit?: number } = {}) =>
    api.get<{ data: Comment[]; total: number; page: number; limit: number }>(`/comments/${commentId}/replies`, { params }).then(r => r.data),

  create: (videoId: number, data: { comment_text: string, episode_id?: number, parent_id?: number }) =>
    api.post<{ comment_id: number; message: string }>(`/videos/${videoId}/comments`, data).then(r => r.data),

  update: (commentId: number, comment_text: string) =>
    api.put<{ message: string }>(`/comments/${commentId}`, { comment_text }).then(r => r.data),

  delete: (commentId: number) =>
    api.delete<{ message: string }>(`/comments/${commentId}`).then(r => r.data),
};

