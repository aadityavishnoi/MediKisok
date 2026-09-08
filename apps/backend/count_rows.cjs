const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const models = [
    'nationalAuthority', 'state', 'district', 'hospital', 'department',
    'role', 'permission', 'doctor', 'patient', 'patientIdentifier',
    'rFIDCard', 'rFIDEvent', 'rFIDDevice', 'patientSession', 'triageQueue',
    'alert', 'operationalAlert', 'consultation', 'doctorNote', 'prescription',
    'diseaseOutbreakSignal', 'aIModel', 'auditLog'
  ];

  console.log('--- CURRENT DATABASE ROW COUNTS ---');
  for (const m of models) {
    if (prisma[m]) {
      const cnt = await prisma[m].count();
      console.log(`${m.padEnd(25)}: ${cnt}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
