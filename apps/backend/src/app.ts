import cors from 'cors';
import express from 'express';
import { env } from './lib/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.js';
import { rfidRouter } from './routes/rfid.js';
import { rfidManagementRouter } from './routes/rfidManagement.js';
import { sessionRouter } from './routes/session.js';
import { consentRouter } from './routes/consent.js';
import { historyRouter } from './routes/history.js';
import { authRouter } from './routes/auth.js';
import { doctorRouter } from './routes/doctor.js';
import { documentsRouter } from './routes/documents.js';
import { aiRouter } from './routes/ai.js';
import { adminRouter } from './routes/admin.js';
import { ttsRouter } from './routes/tts.js';
import { otpRouter } from './routes/otp.js';
import { patientRegistrationRouter } from './routes/patientRegistration.js';
import { discoveryRouter } from './routes/discovery.js';
import { hospitalRouter } from './routes/hospital.js';
import { hospitalAdminRouter } from './routes/hospitalAdmin.js';
import { queueRouter } from './routes/queue.js';
import { prescriptionsRouter } from './routes/prescriptions.js';
import { surveillanceRouter } from './routes/surveillance.js';
import { interoperabilityRouter } from './routes/interoperability.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : true,
    }),
  );
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  const routers = [
    healthRouter,
    rfidRouter,
    rfidManagementRouter,
    sessionRouter,
    consentRouter,
    historyRouter,
    authRouter,
    doctorRouter,
    documentsRouter,
    aiRouter,
    adminRouter,
    ttsRouter,
    otpRouter,
    patientRegistrationRouter,
    discoveryRouter,
    hospitalRouter,
    hospitalAdminRouter,
    queueRouter,
    prescriptionsRouter,
    surveillanceRouter,
    interoperabilityRouter,
  ];

  for (const r of routers) {
    app.use('/api', r);
    app.use('/', r);
  }

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  app.use(errorHandler);

  return app;
}
