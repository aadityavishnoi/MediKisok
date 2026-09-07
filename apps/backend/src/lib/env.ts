import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('postgresql://medikiosk:medikiosk@localhost:5432/medikiosk?schema=public'),
  JWT_SECRET: z.string().default('medikiosk-default-jwt-secret-key-32chars'),
  JWT_EXPIRES_IN: z.string().default('12h'),
  DEVICE_KEY: z.string().default('medikiosk-default-device-key-32chars'),
  DEMO_MODE: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  AI_PROVIDER: z.enum(['LOCAL', 'MOCK', 'REAL']).default('LOCAL'),
  ANTHROPIC_API_KEY: z.string().optional().default(''),
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),
  RFID_SERIAL_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  RFID_SERIAL_PORT: z.string().default('COM3'),
  RFID_SERIAL_BAUD: z.coerce.number().default(9600),
  RFID_DEBOUNCE_MS: z.coerce.number().default(1500),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration - check .env against .env.example');
}

export const env = parsed.data;

// Ensure libraries reading process.env directly (such as PrismaClient) have defaults
process.env.DATABASE_URL = process.env.DATABASE_URL || env.DATABASE_URL;
process.env.DEVICE_KEY = process.env.DEVICE_KEY || env.DEVICE_KEY;
process.env.JWT_SECRET = process.env.JWT_SECRET || env.JWT_SECRET;

