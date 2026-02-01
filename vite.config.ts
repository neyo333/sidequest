import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
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
    hmr: true, // Force Hot Module Replacement
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

});