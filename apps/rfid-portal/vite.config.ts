import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5175,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: (process.env.VITE_API_URL || 'http://localhost:4000').replace(/^http/, 'ws'),
        ws: true,
        changeOrigin: true,
      },
    },
  },
});

