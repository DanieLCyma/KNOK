// src/App.tsx
import React from "react";
import "./styles/globals.css";
import { Routes, Route } from "react-router-dom";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/shared/ProtectedRoute";

// pages
import HomePage from "./pages/HomePage";
import AboutUs from "./pages/AboutUs";
import History from "./pages/History";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import Contact from "./pages/Contact";

// interview
import { UploadResume } from "./pages/interview/UploadResume";
import { EnvironmentCheck } from "./pages/interview/EnvironmentCheck";
import { InterviewSession } from "./pages/interview/InterviewSession";
import FeedbackReport from "./pages/interview/FeedbackReport";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      {/* 상단 네비 */}
      <Header />

      {/* 콘텐츠 (헤더 높이만큼 pt + 적당한 pb) */}
      <div className="flex-1 pt-[92px] pb-16">
        <Routes>
          {/* 공개 라우트 */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/contact" element={<Contact />} />

          {/* 보호된 라우트 */}
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/upload-resume"
            element={
              <ProtectedRoute>
                <UploadResume />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/check-environment"
            element={
              <ProtectedRoute>
                <EnvironmentCheck />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/session"
            element={
              <ProtectedRoute>
                <InterviewSession />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/feedback"
            element={
              <ProtectedRoute>
                <FeedbackReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/feedback/:id"
            element={
              <ProtectedRoute>
                <FeedbackReport />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>

      {/* 하단 푸터 */}
      <Footer />
    </div>
  );
}

export default App;