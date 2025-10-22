// src/components/layout/Footer.tsx

import React from "react";
import { Link } from "react-router-dom";

const navigation = {
  main: [
    { name: "Home",      href: "/" },
    { name: "About us",  href: "/about" },
    { name: "Interview", href: "/interview/upload-resume" },
    { name: "History",   href: "/history" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-900">
      <div className="relative max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8">
        {/* 왼쪽 로고 */}
        <Link
          to="/"
          className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-4"
        >
          <img src="/logo.png" alt="KNOK Logo" className="h-16 w-auto" />
          <div className="flex flex-col leading-tight">
            <span className="text-4xl font-extrabold text-primary tracking-tight">
              KNOK
            </span>
            <span className="mt-1 text-2xl text-gray-400">
              SINCE 2025
            </span>
          </div>
        </Link>

        {/* 가운데 네비 */}
        <nav className="flex justify-center space-x-8">
          {navigation.main.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="text-gray-100 hover:text-gray-300 text-lg font-medium transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
