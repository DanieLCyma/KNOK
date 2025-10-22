// src/services/auth.ts
import { publicApi } from './api';

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
  id_token?: string;
  access_token?: string;
}

export interface EmailConfirmRequest {
  email: string;
  code: string;
}

export const authApi = {
  // 🔓 회원가입 (공개)
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await publicApi.post<AuthResponse>('/signup/', data);
    return response.data;
  },

  // 🔓 이메일 인증 (공개)
  confirmEmail: async (data: EmailConfirmRequest): Promise<AuthResponse> => {
    const response = await publicApi.post<AuthResponse>('/confirm-email/', data);
    return response.data;
  },

  // 🔓 로그인 (공개)
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await publicApi.post<AuthResponse>('/login/', data);
    // 토큰 저장은 AuthContext에서 처리하므로 여기서는 제거
    return response.data;
  },

  // 🔐 로그아웃 (토큰 삭제는 AuthContext에서 처리)
  logout: () => {
    // setAuthToken(null) 호출은 AuthContext에서 처리
  },
};
