// src/components/layout/index.tsx
import React from 'react'
import Header from './Header'
import Footer from './Footer'

interface LayoutProps { children: React.ReactNode }

const Layout: React.FC<LayoutProps> = ({ children }) => (
  <>
    <Header />
    <main className="pt-[92px]">{children}</main>
    <Footer />
  </>
)

export default Layout
