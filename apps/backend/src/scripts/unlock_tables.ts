import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const prisma = new PrismaClient();

async function unlock() {
  const tables = [
    'Appointment',
    'BillingInvoice',
    'Patient',
    'PatientNotification',
    'PatientPrescription',
    'Hospital',
    'Doctor',
    'PatientSession',
    'TriageQueue',
    'Consultation',
    'Prescription'
  ];

  for (const t of tables) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${t}" SET (schema_locked = false);`);
      console.log(`✓ Unlocked table "${t}"`);
    } catch (e: any) {
      // Table may not exist or not have schema_locked
      console.log(`- Table "${t}": ${e.message.split('\n')[0]}`);
    }
  }

  await prisma.$disconnect();
}

unlock();
