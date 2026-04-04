// ─── AUTH ─────────────────────────────────────────────────────────────────────

import { RegisterPayload, AuthResponse, LoginPayload } from "@/app/types";
import api from "./client";

export const authApi = {
  register: (data: RegisterPayload) =>
    api.post<AuthResponse>('/auth/register', data).then(r => r.data),

  login: (data: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', data).then(r => r.data),

  loginGoogle: (id_token: string, device_type = 'web', device_name = 'Browser') =>
    api.post<AuthResponse>('/auth/login/google', { id_token, device_type, device_name }).then(r => r.data),

  logout: (refresh_token: string) =>
    api.post('/auth/logout', { refresh_token }).then(r => r.data),

  refreshToken: (refresh_token: string) =>
    api.post<{ access_token: string; refresh_token: string }>('/auth/refresh-token', { refresh_token }).then(r => r.data),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }).then(r => r.data),

  resetPassword: (data: { email: string; otp: string; new_password: string; confirm_password: string }) =>
    api.post('/auth/reset-password', data).then(r => r.data),

  changePassword: (data: { current_password: string; new_password: string; confirm_password: string }) =>
    api.post('/auth/change-password', data).then(r => r.data),
}