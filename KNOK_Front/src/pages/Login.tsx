import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Input } from "../components/shared/Input";
import { Button } from "../components/shared/Button";
import Layout from "../components/layout/Layout";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 이전 페이지 정보 가져오기
  const from = (location.state as { from?: string })?.from || "/";

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  
  // 이미 로그인된 경우 리디렉션
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from);
    }
  }, [isAuthenticated, navigate, from]);

  const validateForm = () => {
    const newErrors = { email: "", password: "" };
    let isValid = true;

    if (!formData.email) {
      newErrors.email = "이메일을 입력해주세요";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "올바른 이메일 형식이 아닙니다";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "비밀번호를 입력해주세요";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        if (res.status === 404) {
          setErrors(p => ({ ...p, email: "등록되지 않은 이메일입니다" }));
        } else if (res.status === 401) {
          setErrors(p => ({ ...p, password: "비밀번호가 올바르지 않습니다" }));
        } else {
          setErrors(p => ({ ...p, email: "로그인에 실패했습니다" }));
        }
        return;
      }

      const data = await res.json();
      // ID 토큰을 우선 사용하도록 순서 변경
      const token = data.id_token ?? data.access_token;
      if (!token) {
        setErrors(p => ({ ...p, email: "토큰이 발급되지 않았습니다" }));
        return;
      }

      // AuthContext.login 에 ID 토큰과 이메일 전달
      // login 함수 내부에서 localStorage에 저장하므로 중복 저장 코드 제거
      login(token, formData.email);

      // 로그인 성공 후 이전 페이지 또는 홈으로 리디렉션
      navigate(from);
    } catch (err) {
      console.error("로그인 오류:", err);
      setErrors(p => ({ ...p, email: "서버와의 통신에 실패했습니다" }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors(p => ({ ...p, [name]: "" }));
    }
  };

  return (
    <Layout noPadding noFooter>
      <div
        // 헤더 높이(예: 64px)를 뺀 나머지 높이로 설정
        style={{ minHeight: 'calc(100vh - 64px)' }}
        className="flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-md w-full space-y-6">
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            로그인
          </h2>
          <p className="text-center text-sm text-gray-600 mb-6">
            또는{" "}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              회원가입
            </Link>
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="이메일 주소"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="비밀번호"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
            />
            <Button type="submit" fullWidth isLoading={isLoading}>
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
