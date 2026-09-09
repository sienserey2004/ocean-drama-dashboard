import api from "./client";
import { Video, PaginatedResponse } from "@/app/types";

export interface CreatorStats {
  total_views: number;
  total_followers: number;
  total_videos: number;
  total_earnings: number;
}

export interface PopularCreator {
  user_id: number;
  name: string;
  profile_image?: string;
  follower_count: number;
  video_count: number;
}

export const creatorApi = {
  getPopular: (limit: number = 6) =>
    api.get<{ data: PopularCreator[] }>('/users/creators/popular', { params: { limit } }).then(r => r.data.data),


  getStats: async (): Promise<CreatorStats> => {
    try {
      const [videos, earnings, profile] = await Promise.all([
        api.get<PaginatedResponse<Video>>('/videos/me', { params: { limit: 1 } }).then(r => r.data),
        api.get<any>('/creator/earnings/realtime').then(r => r.data),
        api.get<any>('/users/me').then(r => r.data),
      ]);
      
      return {
        total_views: (earnings as any).adRevenue?.totalViews || (profile as any).total_views || 0,
        total_followers: (profile as any).follower_count || 0,
        total_videos: videos.total || 0,
        total_earnings: (earnings as any).totalEarningsUsd
          ?? (earnings as any).summary?.total_net
          ?? (earnings as any).total_net
          ?? 0,
      };
    } catch (error) {
      console.error("Failed to fetch creator stats", error);
      throw error;
    }
  },

  getRecentVideos: async (limit: number = 5) => {
    const { data } = await api.get<PaginatedResponse<Video>>('/videos/me', { params: { sort: 'updated_at:desc' } })
    return { ...data, data: (data.data || []).slice(0, limit) }
  },
};
