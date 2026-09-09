import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5178,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'https://medikiosk-xa4l.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
