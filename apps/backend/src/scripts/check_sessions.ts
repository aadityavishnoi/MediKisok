import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sessions = await prisma.patientSession.findMany({
    include: {
      patient: true,
      clinicalHistory: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`TOTAL_SESSIONS: ${sessions.length}`);
  for (const s of sessions) {
    console.log(`SESSION: ${s.id} | Status: ${s.status} | Patient: ${s.patient?.fullName} (${s.patientId}) | Complaint: ${s.clinicalHistory?.chiefComplaint} | Created: ${s.createdAt.toISOString()}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
