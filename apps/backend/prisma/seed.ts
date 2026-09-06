import { PrismaClient } from '@prisma/client';
import { IdentificationMethod } from '@medikiosk/shared-types';

const prisma = new PrismaClient();

// Stable IDs so re-running this script is idempotent - never creates duplicate demo rows.
const DEMO_PATIENT_001_ID = 'demo-patient-001';
const DEMO_RFID_CARD_001_ID = 'demo-rfid-card-001';

async function main() {
  const patient001 = await prisma.patient.upsert({
    where: { id: DEMO_PATIENT_001_ID },
    update: {},
    create: {
      id: DEMO_PATIENT_001_ID,
      fullName: 'Demo Patient 001',
      dateOfBirth: new Date('1985-03-14'),
      gender: 'Male',
      phone: '9999900001',
      registrationSource: IdentificationMethod.DEMO,
      isDemo: true,
    },
  });

  await prisma.rFIDCard.upsert({
    where: { uid: 'DEMO-RFID-001' },
    update: { patientId: patient001.id },
    create: {
      id: DEMO_RFID_CARD_001_ID,
      uid: 'DEMO-RFID-001',
      patientId: patient001.id,
      isDemo: true,
      active: true,
    },
  });

  console.log('Seed complete: Demo Patient 001 (RFID UID DEMO-RFID-001).');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
