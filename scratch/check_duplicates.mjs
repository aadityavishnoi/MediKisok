import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('apps/backend/.env') });
const p = new PrismaClient();

async function check() {
  try {
    const states = await p.state.groupBy({
      by: ['code'],
      _count: { code: true },
      having: { code: { _count: { gt: 1 } } }
    });
    console.log('Duplicate state codes:', states);

    const configs = await p.systemConfig.groupBy({
      by: ['facilityId', 'configKey'],
      _count: { configKey: true },
      having: { configKey: { _count: { gt: 1 } } }
    });
    console.log('Duplicate systemConfigs:', configs);

    const userRoles = await p.userRole.groupBy({
      by: ['doctorId', 'roleId', 'facilityId'],
      _count: { doctorId: true },
      having: { doctorId: { _count: { gt: 1 } } }
    });
    console.log('Duplicate userRoles:', userRoles);

    // Check patients with duplicate emails (excluding null)
    const patients = await p.patient.findMany({
      where: { email: { not: null } },
      select: { email: true }
    });
    const emailCounts = {};
    for (const pat of patients) {
      if (pat.email) {
        emailCounts[pat.email] = (emailCounts[pat.email] || 0) + 1;
      }
    }
    const dupEmails = Object.entries(emailCounts).filter(([k, v]) => v > 1);
    console.log('Duplicate patient emails:', dupEmails);

  } catch (err) {
    console.error('Check error:', err);
  } finally {
    await p.$disconnect();
  }
}

check();
