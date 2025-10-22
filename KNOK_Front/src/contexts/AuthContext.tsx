// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface AuthContextValue {
  token: string | null;
  userEmail: string | null;
  login: (token: string, email: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  userEmail: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
  isLoading: true,
});

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 앱 시작 시 localStorage에서 복원
  useEffect(() => {
    const savedToken = localStorage.getItem('id_token') || localStorage.getItem('access_token');
    const savedEmail = localStorage.getItem('user_email');

    if (savedToken) {
      setToken(savedToken);
    }
    
    if (savedEmail) setUserEmail(savedEmail);

    setIsLoading(false);
  }, []);

  const login = (newToken: string, email: string) => {
    localStorage.setItem('id_token', newToken);
    localStorage.setItem('access_token', newToken);
    localStorage.setItem('user_email', email);
    
    setToken(newToken);
    setUserEmail(email);
    
    console.log('로그인 성공:', { email });
  };

  const logout = () => {
    localStorage.removeItem('id_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_email');
    
    setToken(null);
    setUserEmail(null);
    
    console.log('로그아웃 완료');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        userEmail,
        login,
        logout,
        isAuthenticated: !!token,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
