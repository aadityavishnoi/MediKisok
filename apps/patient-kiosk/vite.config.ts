import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function droidcamLocalPlugin() {
  return {
    name: 'droidcam-local-proxy',
    configureServer(server: any) {
      server.middlewares.use('/local-droidcam-frame', async (req: any, res: any) => {
        try {
          const url = new URL(req.url, 'http://localhost:5173');
          const ip = url.searchParams.get('ip');
          if (!ip) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing ip parameter' }));
            return;
          }

          let cleaned = ip.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
          if (!cleaned.includes(':')) cleaned = `${cleaned}:4747`;

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 4000);

          const response = await fetch(`http://${cleaned}/video`, {
            signal: controller.signal,
          });

          if (!response.ok || !response.body) {
            clearTimeout(timeout);
            res.statusCode = 502;
            res.end(JSON.stringify({ error: 'Could not connect to DroidCam video stream' }));
            return;
          }

          const reader = response.body.getReader();
          let accumulated = Buffer.alloc(0);
          let startIndex = -1;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              accumulated = Buffer.concat([accumulated, Buffer.from(value)]);
              if (startIndex === -1) {
                for (let i = 0; i < accumulated.length - 1; i++) {
                  if (accumulated[i] === 0xff && accumulated[i + 1] === 0xd8) {
                    startIndex = i;
                    break;
                  }
                }
              }

              if (startIndex !== -1) {
                for (let i = startIndex + 2; i < accumulated.length - 1; i++) {
                  if (accumulated[i] === 0xff && accumulated[i + 1] === 0xd9) {
                    const frameBuffer = accumulated.subarray(startIndex, i + 2);
                    clearTimeout(timeout);
                    controller.abort();
                    res.setHeader('Content-Type', 'image/jpeg');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Cache-Control', 'no-cache');
                    res.end(frameBuffer);
                    return;
                  }
                }
              }
            }
          }

          clearTimeout(timeout);
          res.statusCode = 504;
          res.end(JSON.stringify({ error: 'Stream frame timeout' }));
        } catch (err: any) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err?.message || 'Error fetching DroidCam frame' }));
        }
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), droidcamLocalPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
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
