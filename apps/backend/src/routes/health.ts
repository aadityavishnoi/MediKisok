import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { env } from '../lib/env.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const healthRouter = Router();

healthRouter.get(
  '/health',
  asyncHandler(async (_req, res) => {
    let dbConnected = true;
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbConnected = false;
    }

    res.status(dbConnected ? 200 : 503).json({
      status: dbConnected ? 'ok' : 'degraded',
      dbConnected,
      demoMode: env.DEMO_MODE,
      aiProvider: env.AI_PROVIDER,
      timestamp: new Date().toISOString(),
    });
  }),
);
