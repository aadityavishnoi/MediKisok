import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up duplicate sessions in CockroachDB...');

  // Mark all IDENTIFIED sessions as ABANDONED so they don't pollute OPD queue
  const updatedIdentified = await prisma.patientSession.updateMany({
    where: { status: 'IDENTIFIED' },
    data: { status: 'ABANDONED' },
  });
  console.log(`Resolved ${updatedIdentified.count} IDENTIFIED sessions to ABANDONED.`);

  // For each patient, keep only their most recent active session; mark any other active session as COMPLETED
  const allPatients = await prisma.patient.findMany({
    include: {
      sessions: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  for (const p of allPatients) {
    if (p.sessions.length > 1) {
      console.log(`Patient ${p.fullName} has ${p.sessions.length} sessions. Keeping latest (${p.sessions[0].id})...`);
      for (let i = 1; i < p.sessions.length; i++) {
        await prisma.patientSession.update({
          where: { id: p.sessions[i].id },
          data: { status: 'COMPLETED' },
        });
        console.log(`  -> Marked older session ${p.sessions[i].id} as COMPLETED`);
      }
    }
  }

  const remainingActive = await prisma.patientSession.findMany({
    where: {
      status: { in: ['IN_CONSULT', 'ROUTED', 'SUMMARY_READY'] },
    },
    include: { patient: true, clinicalHistory: true },
    orderBy: { updatedAt: 'desc' },
  });

  console.log(`\nTOTAL ACTIVE QUEUE SESSIONS IN DB: ${remainingActive.length}`);
  for (const s of remainingActive) {
    console.log(`  Patient: ${s.patient?.fullName} | Status: ${s.status} | Complaint: ${s.clinicalHistory?.chiefComplaint}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
