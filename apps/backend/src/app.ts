import cors from 'cors';
import express from 'express';
import { env } from './lib/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.js';
import { rfidRouter } from './routes/rfid.js';
import { sessionRouter } from './routes/session.js';
import { consentRouter } from './routes/consent.js';
import { historyRouter } from './routes/history.js';
import { authRouter } from './routes/auth.js';
import { doctorRouter } from './routes/doctor.js';
import { documentsRouter } from './routes/documents.js';
import { aiRouter } from './routes/ai.js';
import { adminRouter } from './routes/admin.js';
import { ttsRouter } from './routes/tts.js';
import { discoveryRouter } from './routes/discovery.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : true,
    }),
  );
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  app.use('/api', healthRouter);
  app.use('/api', rfidRouter);
  app.use('/api', sessionRouter);
  app.use('/api', consentRouter);
  app.use('/api', historyRouter);
  app.use('/api', authRouter);
  app.use('/api', doctorRouter);
  app.use('/api', documentsRouter);
  app.use('/api', aiRouter);
  app.use('/api', adminRouter);
  app.use('/api', ttsRouter);
  app.use('/api', discoveryRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  app.use(errorHandler);

  return app;
}

