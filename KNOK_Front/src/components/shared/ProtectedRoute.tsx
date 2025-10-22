// src/components/shared/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 인증 상태 로딩 중일 때는 로딩 표시
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // 로그인 페이지로 리다이렉트, 현재 경로를 state로 남겨둡니다.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 인증된 경우 자식 컴포넌트 렌더
  return <>{children}</>;
};

export default ProtectedRoute;
