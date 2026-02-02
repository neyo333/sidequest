import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: "/sidequest/", 
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@db': path.resolve(__dirname, './db'),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  build: {
    outDir: 'dist/public',
    emptyOutDir: true,
  },
  server: {
    // 👇 PASTE THE NEW CONFIGURATION HERE 👇
    host: '0.0.0.0',
    allowedHosts: [
      'sidequest-production.up.railway.app',
      'sidequest.com' // You can add your custom domain here too
    ],
    // 👆 END OF NEW CONFIGURATION 👆
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
