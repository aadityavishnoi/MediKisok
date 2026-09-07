import { Router } from 'express';
import https from 'https';

export const ttsRouter = Router();

/**
 * GET /api/tts?text=...&lang=hi
 * Server-side proxy for Google Translate TTS — bypasses browser CORS restrictions.
 * Fetches audio from Google Translate and streams it back to the client.
 */
ttsRouter.get('/tts', (req, res) => {
  const text = req.query.text as string;
  const lang = req.query.lang as string;

  if (!text || !lang) {
    res.status(400).json({ error: 'text and lang query params are required' });
    return;
  }

  const encodedText = encodeURIComponent(text.slice(0, 200)); // max 200 chars
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=tw-ob&ttsspeed=0.9`;

  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
      'Referer': 'https://translate.google.com/',
      'Accept': 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8',
    },
  };

  https.get(url, options, (upstream) => {
    res.setHeader('Content-Type', upstream.headers['content-type'] || 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    upstream.pipe(res);
  }).on('error', (err) => {
    console.error('[TTS proxy] Google TTS fetch failed:', err.message);
    res.status(502).json({ error: 'TTS fetch failed' });
  });
});
