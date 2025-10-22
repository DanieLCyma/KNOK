// 파일 경로: src/pages/Contact.tsx

import React, { useState, ChangeEvent, FormEvent } from "react";

const Contact: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/contact/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          message,
        }),
      });

      if (response.ok) {
        alert("문의가 정상적으로 접수되었습니다.");
        // 폼 초기화
        setName("");
        setEmail("");
        setMessage("");
      } else {
        const err = await response.json();
        alert("전송 실패: " + (err?.error || "서버 오류"));
      }
    } catch (error) {
      console.error("에러 발생:", error);
      alert("알 수 없는 오류가 발생했습니다.");
    }
  };


  return (
    <div className="min-h-screen bg-white pt-[92px]">
      {/* Header 고정 높이(92px) 만큼 위쪽 여백을 줘서 겹치지 않도록 */}
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-4 text-[#8447e9]">문의하기</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            placeholder="이름"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#8447e9]"
            required
          />

          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#8447e9]"
            required
          />

          <textarea
            placeholder="문의 내용"
            value={message}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded h-40 resize-none focus:outline-none focus:ring-2 focus:ring-[#8447e9]"
            required
          />

          <button
            type="submit"
            className="bg-[#8447e9] text-white px-6 py-3 rounded hover:bg-[#6d3fcb] transition"
          >
            보내기
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
