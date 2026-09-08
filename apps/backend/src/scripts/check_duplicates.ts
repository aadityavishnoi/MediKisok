import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
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

    const dupUserRoles = await p.userRole.findMany({
      where: {
        doctorId: 'demo-doctor-004',
        roleId: 'cmtsfvdbr000fj517va6nr5mh',
        facilityId: null
      }
    });
    if (dupUserRoles.length > 1) {
      for (let i = 1; i < dupUserRoles.length; i++) {
        await p.userRole.delete({ where: { id: dupUserRoles[i].id } });
        console.log('Successfully removed redundant UserRole duplicate:', dupUserRoles[i].id);
      }
    }

    const patients = await p.patient.findMany({
      where: { email: { not: null } },
      select: { email: true }
    });
    const emailCounts: Record<string, number> = {};
    for (const pat of patients) {
      if (pat.email) {
        emailCounts[pat.email] = (emailCounts[pat.email] || 0) + 1;
      }
    }
    const dupEmails = Object.entries(emailCounts).filter(([_, v]) => v > 1);
    console.log('Duplicate patient emails:', dupEmails);

  } catch (err) {
    console.error('Check error:', err);
  } finally {
    await p.$disconnect();
  }
}

check();
