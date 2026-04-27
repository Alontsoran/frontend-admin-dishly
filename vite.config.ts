import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    host: '0.0.0.0',
    strictPort: false,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'admin.dowe.co.il',
      'dowe.co.il',
      'www.dowe.co.il',
      '.dowe.co.il',
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5100',
        changeOrigin: true,
        secure: false
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  preview: {
    port: 3001,
    host: '0.0.0.0'
  }
})
