import api from "./client";

export interface LikeStatus {
  video_id: number;
  like_count: number;
  user_liked: boolean;
}

export interface FavoriteStatus {
  message: string;
}

export const engagementApi = {
  // LIKES
  like: (videoId: number) => 
    api.post<{ message: string; like_count: number }>(`/videos/${videoId}/like`).then(r => r.data),
    
  unlike: (videoId: number) => 
    api.delete<{ message: string; like_count: number }>(`/videos/${videoId}/like`).then(r => r.data),
    
  getLikes: (videoId: number) => 
    api.get<LikeStatus>(`/videos/${videoId}/likes`).then(r => r.data),

  // FAVORITES
  addFavorite: (videoId: number) => 
    api.post<FavoriteStatus>(`/videos/${videoId}/favorite`).then(r => r.data),
    
  removeFavorite: (videoId: number) => 
    api.delete<FavoriteStatus>(`/videos/${videoId}/favorite`).then(r => r.data),
};

