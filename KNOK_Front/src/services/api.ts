import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// 🔓 공개 API용 - 토큰 없음
export const publicApi = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔐 인증 API용 - 토큰 포함 (각 호출 시 토큰을 명시적으로 전달)
export const apiWithAuth = (token: string | null) => {
  const instance = axios.create({
    baseURL: API_BASE,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  
  // 응답 인터셉터 - 401 시 로그인 이동
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // 로그아웃 처리는 AuthContext의 logout 함수를 사용하도록 수정
        // 여기서는 단순히 로그인 페이지로 이동만 처리
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
  
  return instance;
};
