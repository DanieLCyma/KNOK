import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/', // ✅ S3 정적 호스팅에 반드시 필요!
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['axios'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://16.184.28.223:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
}) 