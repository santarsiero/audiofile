import { apiClient } from './api';

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    userId: string;
    email: string;
  };
};

type RefreshResponse = {
  accessToken: string;
  refreshToken?: string;
};

export async function login(email: string, password: string): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>('auth/login', { email, password });
}

export async function refresh(refreshToken: string): Promise<RefreshResponse> {
  return apiClient.post<RefreshResponse>('auth/refresh', { refreshToken });
}

export const authApi = {
  login,
  refresh,
} as const;
