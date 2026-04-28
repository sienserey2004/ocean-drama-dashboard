import api from "./client";
import { Video, PaginatedResponse, EarningsSummary } from "@/app/types";

export interface CreatorStats {
  total_views: number;
  total_followers: number;
  total_videos: number;
  total_earnings: number;
}

export const creatorApi = {
  getStats: async (): Promise<CreatorStats> => {
    try {
      const [videos, earnings, profile] = await Promise.all([
        api.get<PaginatedResponse<Video>>('/videos/me', { params: { limit: 1 } }).then(r => r.data),
        api.get<EarningsSummary>('/creator/earnings/realtime').then(r => r.data),
        api.get<any>('/users/me').then(r => r.data),
      ]);
      
      return {
        total_views: (profile as any).total_views || 0,
        total_followers: (profile as any).follower_count || 0,
        total_videos: videos.total || 0,
        total_earnings: earnings.summary?.total_net || 0,
      };
    } catch (error) {
      console.error("Failed to fetch creator stats", error);
      throw error;
    }
  },

  getRecentVideos: (limit: number = 5) =>
    api.get<PaginatedResponse<Video>>('/videos/me', { params: { limit, sort: 'created_at:desc' } }).then(r => r.data),
};
