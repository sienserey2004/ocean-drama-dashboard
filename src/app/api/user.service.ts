// ─── USER PROFILE ─────────────────────────────────────────────────────────────
import { User, PublicProfile, PaginationParams, PaginatedResponse, VideoPurchase, Video } from "@/app/types";
import api from "./client";

export const userApi = {
  getMe: async (): Promise<User | null> => {
    try {
      const response = await api.get<User>('/users/me');
      console.log("User profile:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch user profile:", error);
      // Only a real auth rejection means "not logged in" — network/5xx errors
      // shouldn't be treated the same, or refreshUser() will log the user out.
      if (error?.response?.status === 401 || error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  updateMe: async (data: { name?: string; phone?: string; profile_image?: string } | FormData): Promise<{ message: string; user: User } | null> => {
    try {
      const response = await api.put<{ message: string; user: User }>('/users/me', data, data instanceof FormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : undefined);
      return response.data;
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      return null;
    }
  },

  deleteMe: async (password: string): Promise<any | null> => {
    try {
      const response = await api.delete('/users/me', { data: { password, confirm_text: 'DELETE MY ACCOUNT' } });
      return response.data;
    } catch (error: any) {
      console.error("Failed to delete account:", error);
      return null;
    }
  },

  getPublicProfile: async (user_id: number): Promise<PublicProfile | null> => {
    try {
      const response = await api.get<PublicProfile>(`/users/${user_id}`);
      console.log("Public profile:", response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch public profile for user ${user_id}:`, error);
      return null;
    }
  },

  getWatchHistory: async (params?: PaginationParams): Promise<PaginatedResponse<any> | null> => {
    try {
      const response = await api.get<PaginatedResponse<any>>('/users/me/watch-history', { params });
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch watch history:", error);
      return null;
    }
  },

  clearWatchHistory: async (): Promise<any | null> => {
    try {
      const response = await api.delete('/users/me/watch-history');
      return response.data;
    } catch (error: any) {
      console.error("Failed to clear watch history:", error);
      return null;
    }
  },

  getPurchases: async (params?: PaginationParams): Promise<PaginatedResponse<VideoPurchase> | null> => {
    try {
      const response = await api.get<PaginatedResponse<VideoPurchase>>('/users/me/purchases', { params });
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch purchases:", error);
      return null;
    }
  },

  getFavorites: async (params?: PaginationParams): Promise<PaginatedResponse<Video> | null> => {
    try {
      const response = await api.get<PaginatedResponse<Video>>('/users/me/favorites', { params });
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch favorites:", error);
      return null;
    }
  },

  getFollowing: async (params?: PaginationParams): Promise<PaginatedResponse<PublicProfile> | null> => {
    try {
      const response = await api.get<PaginatedResponse<PublicProfile>>('/users/me/following', { params });
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch following list:", error);
      return null;
    }
  },

  getFollowers: async (creator_id: number, params?: PaginationParams): Promise<PaginatedResponse<User> | null> => {
    try {
      const response = await api.get<PaginatedResponse<User>>(`/users/${creator_id}/followers`, { params });
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch followers of creator ${creator_id}:`, error);
      return null;
    }
  },

  follow: async (creator_id: number): Promise<any | null> => {
    try {
      const response = await api.post(`/users/${creator_id}/follow`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to follow user ${creator_id}:`, error);
      return null;
    }
  },

  unfollow: async (creator_id: number): Promise<any | null> => {
    try {
      const response = await api.delete(`/users/${creator_id}/follow`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to unfollow user ${creator_id}:`, error);
      return null;
    }
  },
};
