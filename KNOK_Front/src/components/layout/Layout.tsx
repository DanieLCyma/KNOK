// src/components/layout/Layout.tsx
import React from "react";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
  /** 헤더 높이만큼 상단 패딩 없앰 (기본 pt-[92px]) */
  noPadding?: boolean;
  /** 푸터를 렌더링하지 않음 */
  noFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  noPadding = false,
  noFooter = false,
}) => {
  return (
    <>
      <Header />
      <div className={noPadding ? "" : "pt-[92px]"}>
        {children}
      </div>
      {!noFooter && <Footer />}
    </>
  );
};

export default Layout;
