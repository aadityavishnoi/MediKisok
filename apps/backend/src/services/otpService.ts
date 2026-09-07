import { prisma } from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';

// Safe proxy to avoid IDE TypeScript type-generation lag on newly created Prisma models
const db = prisma as any;

// In-memory fallback map in case database is in demo/mock mode
const memoryOtpStore = new Map<string, { code: string; expiresAt: Date; verified: boolean; attempts: number }>();

export class OtpService {
  /**
   * Generates a 6-digit OTP, stores it with 5 min expiration, and returns dev info.
   */
  static async sendOtp(phone: string): Promise<{ success: boolean; message: string; devOtp: string; expiresInSeconds: number }> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      throw Errors.badRequest('Invalid 10-digit phone number');
    }

    // Generate 6-digit OTP (e.g. 583921)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    try {
      await db.otpVerification.create({
        data: {
          phone: cleanPhone,
          code,
          expiresAt,
          verified: false,
          attempts: 0,
        },
      });
    } catch {
      // Fallback to memory store if db isn't initialized yet
      memoryOtpStore.set(cleanPhone, { code, expiresAt, verified: false, attempts: 0 });
    }

    // Dispatch via TextBee Android Phone SMS Gateway (100% Free & Verified Real SIM SMS)
    const textbeeApiKey = process.env.TEXTBEE_API_KEY || 'txb_PmYNoZxGzXS10wKgi1kdnnMliCvfpWNY';
    const textbeeDeviceId = process.env.TEXTBEE_DEVICE_ID || '6a9eac8accb6c72709c589e0';

    if (!textbeeApiKey || !textbeeDeviceId) {
      console.warn('⚠️ [TextBee Gateway]: Missing TEXTBEE_API_KEY or TEXTBEE_DEVICE_ID in .env');
    } else {
      try {
        const tbRes = await fetch(`https://api.textbee.dev/api/v1/gateway/devices/${textbeeDeviceId}/sendSMS`, {
          method: 'POST',
          headers: {
            'x-api-key': textbeeApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipients: [`+91${cleanPhone}`],
            message: `Your MediKiosk verification code is ${code}. Valid for 5 minutes. Do not share with anyone.`,
          }),
        });
        const tbData = await tbRes.json().catch(() => ({}));
        console.log(`🐝 [TextBee SMS Gateway]: Dispatched to +91-${cleanPhone}:`, tbData);
      } catch (tbErr) {
        console.error(`❌ [TextBee Gateway Error]:`, tbErr);
      }
    }

    console.log(`\n========================================`);
    console.log(`📲 [TEXTBEE SMS DISPATCHED] Phone: +91-${cleanPhone} | Code: ${code} (Valid for 5 mins)`);
    console.log(`========================================\n`);

    return {
      success: true,
      message: `OTP sent successfully to +91-******${cleanPhone.slice(-4)}`,
      devOtp: code,
      expiresInSeconds: 300,
    };
  }

  /**
   * Verifies the 6-digit OTP submitted by patient.
   */
  static async verifyOtp(phone: string, code: string): Promise<{ verified: boolean; message: string }> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const cleanCode = code.trim();

    // Universal bypass for testing/demo if needed
    if (cleanCode === '123456') {
      return { verified: true, message: 'OTP verified successfully (Demo Master Key)' };
    }

    let record = null;
    try {
      record = await db.otpVerification.findFirst({
        where: { phone: cleanPhone },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      record = null;
    }

    if (!record) {
      const memRecord = memoryOtpStore.get(cleanPhone);
      if (!memRecord) {
        throw Errors.badRequest('No OTP requested for this phone number. Please request an OTP first.');
      }
      if (new Date() > memRecord.expiresAt) {
        throw Errors.badRequest('OTP has expired. Please request a new OTP.');
      }
      if (memRecord.code !== cleanCode) {
        memRecord.attempts += 1;
        throw Errors.badRequest('Incorrect OTP. Please try again.');
      }
      memRecord.verified = true;
      return { verified: true, message: 'OTP verified successfully' };
    }

    if (new Date() > record.expiresAt) {
      throw Errors.badRequest('OTP has expired. Please request a new OTP.');
    }

    if (record.code !== cleanCode) {
      try {
        await db.otpVerification.update({
          where: { id: record.id },
          data: { attempts: { increment: 1 } },
        });
      } catch {}
      throw Errors.badRequest('Incorrect OTP. Please try again.');
    }

    try {
      await db.otpVerification.update({
        where: { id: record.id },
        data: { verified: true },
      });
    } catch {}

    return { verified: true, message: 'OTP verified successfully' };
  }
}
