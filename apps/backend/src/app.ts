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

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : true,
    }),
  );
  app.use(express.json());

  app.use('/api', healthRouter);
  app.use('/api', rfidRouter);
  app.use('/api', sessionRouter);
  app.use('/api', consentRouter);
  app.use('/api', historyRouter);
  app.use('/api', authRouter);
  app.use('/api', doctorRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  app.use(errorHandler);

  return app;
}
