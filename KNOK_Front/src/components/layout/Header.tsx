// src/components/layout/Header.tsx
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";

const navItems = [
  { name: "Home", path: "/" },
  { name: "About us", path: "/about" },
  { name: "Interview", path: "/interview/upload-resume" },
  { name: "History", path: "/history" },
];

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[92px]">
          {/* 로고 */}
          <Link to="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="KNOK Logo" className="h-12 w-auto" />
            <span className="text-[32px] font-semibold text-primary tracking-tighter">
              KNOK
            </span>
          </Link>

          {/* 중앙 네비 */}
          <div className="hidden md:flex items-center space-x-10">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={
                  pathname === item.path
                    ? "text-primary font-medium"
                    : "text-gray-900 font-medium hover:text-primary transition-colors"
                }
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* 우측 버튼 */}
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/login"
                    className="bg-primary text-white px-6 py-3 rounded-md text-base font-medium hover:bg-primary/90 transition-colors"
                  >
                    Login
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/register"
                    className="border border-primary text-primary px-6 py-3 rounded-md text-base font-medium hover:bg-primary hover:text-white transition-colors"
                  >
                    Sign Up
                  </Link>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/contact"
                    className="bg-primary text-white px-6 py-3 rounded-md text-base font-medium hover:bg-primary/90 transition-colors"
                  >
                    문의하기
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <button
                    onClick={handleLogout}
                    className="border border-primary text-primary px-6 py-3 rounded-md text-base font-medium hover:bg-primary hover:text-white transition-colors"
                  >
                    로그아웃
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
