// src/pages/interview/UploadResume.tsx

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/shared/Button";
import Layout from "../../components/layout";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const UploadResume: React.FC = () => {
  const navigate = useNavigate();
  const { token, userEmail, isAuthenticated } = useAuth();

  const [resume, setResume] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedResumeUrl, setUploadedResumeUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 서버에서 현재 업로드된 이력서 URL을 가져오는 함수
  const fetchResume = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/resume/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("이력서 조회 실패");
      const data = await res.json();
      setUploadedResumeUrl(data.file_url || null);
    } catch (err) {
      console.error("이력서 조회 실패:", err);
    }
  };

  // 컴포넌트 첫 렌더링 시 한 번 조회
  useEffect(() => {
    fetchResume();
  }, [token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setResume(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!resume) return;
    if (!isAuthenticated || !token) return alert("로그인이 필요합니다.");

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("resume", resume);

      const res = await fetch(`${API_BASE}/resume/upload/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!res.ok) throw new Error("이력서 업로드 실패");

      const data = await res.json();
      setUploadedResumeUrl(data.file_url || null);
      alert("이력서가 성공적으로 업로드되었습니다.");
      setResume(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchResume();
    } catch (err) {
      console.error("이력서 업로드 실패:", err);
      alert("이력서 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!isAuthenticated || !token) return alert("로그인이 필요합니다.");

    try {
      const res = await fetch(`${API_BASE}/resume/delete/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("이력서 삭제 실패");

      alert("이력서가 성공적으로 삭제되었습니다.");
      setResume(null);
      setUploadedResumeUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("이력서 삭제 실패:", err);
      alert("이력서 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleStartInterview = () => {
    if (uploadedResumeUrl) {
      navigate("/interview/check-environment");
    }
  };

  return (
    
      <div className="-mt-[92px] pt-[92px] bg-white min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* 페이지 타이틀 */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-normal text-gray-900">
              AI 면접&nbsp;
              <span className="text-[#8447e9] font-semibold">KNOK</span>
              &nbsp;서비스 시작하기
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              이력서를 업로드하고 AI 면접을 준비하세요
            </p>
          </div>

          {/* 이력서 업로드 섹션 */}
          <div className="space-y-6 bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                이력서 업로드
              </label>
              <div className="mt-1 flex items-center space-x-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-primary file:text-white
                    hover:file:cursor-pointer hover:file:bg-primary/90 hover:file:text-white"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleUpload}
                  isLoading={isUploading}
                  disabled={!resume || isUploading}
                >
                  업로드
                </Button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                PDF, DOC, DOCX 형식을 지원합니다
              </p>
            </div>

            {/* 업로드된 이력서 표시 */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    업로드된 이력서
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {uploadedResumeUrl ? (
                      <>
                        <a
                          href={uploadedResumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          보기
                        </a>
                        <span className="ml-2 text-gray-400">
                          ({uploadedResumeUrl.split("/").pop()})
                        </span>
                      </>
                    ) : (
                      "업로드된 이력서가 없습니다"
                    )}
                  </p>
                </div>
                {(resume || uploadedResumeUrl) && (
                  <Button
                    type="button"
                    variant="danger"
                    size="md"
                    onClick={handleDelete}
                  >
                    삭제
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* AI 면접 준비 섹션 */}
          <div className="mt-8 bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              AI 면접 준비
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              이력서를 업로드하면 AI가 분석하여 맞춤형 면접 질문을 생성합니다
            </p>
            <div className="mt-4">
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleStartInterview}
                disabled={!uploadedResumeUrl}
              >
                AI 면접 시작하기
              </Button>
            </div>
          </div>
        </div>
      </div>
    
  );
};

export default UploadResume;