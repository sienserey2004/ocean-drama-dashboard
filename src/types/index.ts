// ─── Enums ───────────────────────────────────────────────────────────────────

export type Role = 'viewer' | 'creator' | 'admin'
export type UserStatus = 'active' | 'suspended' | 'banned' | 'deleted'
export type VideoStatus = 'pending' | 'published' | 'rejected'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed'
export type NotificationType = 'new_episode' | 'payment' | 'system' | 'warning'
export type DeviceType = 'mobile' | 'web' | 'tablet'
export type SharePlatform = 'facebook' | 'telegram' | 'whatsapp' | 'copy'

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  user_id: number
  firebase_uid: string
  name: string
  email: string
  phone?: string
  role: Role
  login_provider: string
  profile_image?: string
  status: UserStatus
  created_at: string
  stats?: {
    purchases_count: number
    favorites_count: number
    following_count: number
    watch_history_count: number
    total_purchases?: number
    total_spent?: number
    active_sessions?: number
  }
}

export interface PublicProfile {
  user_id: number
  name: string
  profile_image?: string
  role: Role
  status: UserStatus
  created_at: string
  stats: {
    follower_count: number
    following_count: number
    video_count: number
    total_likes: number
  }
  is_following: boolean
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string
  password: string
  device_type: DeviceType
  device_name: string
  ip_address: string
}

export interface RegisterPayload extends LoginPayload {
  name: string
  phone?: string
  login_provider: 'email'
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  session_id: number
  user: User
}

// ─── Video ───────────────────────────────────────────────────────────────────
export interface VideoRess {
  video_id: number;
  title: string;
  status: "published" | "pending";
  creator: string;
  episodes_count: number;
  price: number;
  thumbnail_url?: string;
}

export interface VideoRes {
  data: VideoRess[];
  total: number;
}

export interface Video {
  video_id: number
  creator_id: number
  reviewed_by_admin_id?: number
  title: string
  description?: string
  thumbnail_url?: string
  price: number
  currency: string
  is_free: boolean
  status: VideoStatus
  reject_reason?: string
  episode_count: number
  like_count: number
  view_count: number
  is_liked?: boolean
  is_favorited?: boolean
  already_purchased?: boolean
  creator: {
    user_id: number
    name: string
    profile_image?: string
    follower_count: number
  }
  categories: { category_id: number; name: string }[]
  tags: { tag_id: number; name: string }[]
  created_at: string
  updated_at: string
}

export interface CreateVideoPayload {
  title: string
  description: string
  thumbnail_url: string
  price: number
  currency?: string
  is_free: boolean
  category_ids: number[]
  tag_ids: number[]
}

export interface UpdateVideoPayload extends Partial<CreateVideoPayload> {}

// ─── Episode ─────────────────────────────────────────────────────────────────

export interface Episode {
  episode_id: number
  video_id: number
  episode_number: number
  title: string
  preview_video_url: string
  full_video_url?: string
  duration: number
  has_access: boolean
  created_at: string
}

export interface CreateEpisodePayload {
  episode_number: number
  title: string
  duration: number
  price?: number
  is_free?: boolean
}

// ─── Category & Tag ──────────────────────────────────────────────────────────

export interface Category {
  category_id: number
  name: string
  description?: string
  video_count?: number
  created_at: string
}

export interface Tag {
  tag_id: number
  name: string
  video_count?: number
  created_at: string
}

// ─── Payment & Purchase ──────────────────────────────────────────────────────

export interface Payment {
  payment_id: number
  user_id: number
  amount: number
  currency: string
  payment_method: string
  transaction_id?: string
  payment_status: PaymentStatus
  created_at: string
}

export interface VideoPurchase {
  purchase_id: number
  user_id: number
  video_id: number
  payment_id: number
  amount_paid: number
  currency: string
  purchase_date: string
  video?: Video
}

export interface CreatorEarning {
  earning_id: number
  creator_id: number
  video_id: number
  video_purchase_id: number
  gross_amount: number
  platform_fee: number
  net_amount: number
  currency: string
  earned_at: string
  episode_title?: string
  video_title?: string
}

export interface EarningsSummary {
  creator_id: number
  period: { from: string; to: string }
  summary: {
    total_gross: number
    total_platform_fee: number
    total_net: number
    currency: string
    total_purchases: number
  }
}

// ─── Notification ────────────────────────────────────────────────────────────

export interface Notification {
  notification_id: number
  user_id: number
  sent_by_admin?: number
  title: string
  message: string
  type: NotificationType
  is_read: boolean
  created_at: string
}

// ─── Report ──────────────────────────────────────────────────────────────────

export interface Report {
  report_id: number
  reported_by: number
  video_id: number
  video_title?: string
  reporter?: { user_id: number; name: string }
  reason: string
  status: ReportStatus
  reviewed_by?: number
  reviewed_at?: string
  created_at: string
}

// ─── Session ─────────────────────────────────────────────────────────────────

export interface DeviceSession {
  session_id: number
  user_id: number
  device_type: DeviceType
  device_name: string
  ip_address: string
  login_time: string
  last_active: string
  is_active: boolean
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface AnalyticsOverview {
  period: { from: string; to: string }
  users: {
    total: number
    new_this_period: number
    active: number
    by_role: { viewer: number; creator: number; admin: number }
  }
  content: {
    total_videos: number
    published: number
    pending: number
    rejected: number
    total_episodes: number
  }
  engagement: {
    total_views: number
    total_likes: number
    total_comments: number
  }
  revenue: {
    total_purchases: number
    gross_revenue: number
    platform_fees: number
    creator_payouts: number
    currency: string
  }
}

export interface RevenueData {
  month: string
  month_num: number
  gross: number
  fees: number
  net: number
  purchases: number
}

export interface TopVideo {
  rank: number
  video_id: number
  title: string
  creator: { user_id: number; name: string }
  views: number
  likes: number
  episodes: number
  total_purchases: number
  gross_revenue: number
  currency: string
}

export interface PlatformOverview {
  total_users: number
  total_videos: number
  total_purchases: number
  total_revenue: number
}

export interface PlatformRevenueTrend {
  month: string
  revenue: number
}

export interface PlatformTopVideo {
  video_id: number
  title: string
  views: number
  revenue: number
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages?: number
}

export interface PaginationParams {
  page?: number
  limit?: number
}

// ─── API Error ───────────────────────────────────────────────────────────────

export interface ApiError {
  message: string
  status: number
  errors?: Record<string, string[]>
}
