const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cards = await prisma.rFIDCard.findMany({
    include: { patient: true }
  });
  console.log(`TOTAL_REGISTERED_CARDS: ${cards.length}`);
  for (const c of cards) {
    console.log(`  UID: ${c.uid} -> Patient: ${c.patient?.fullName || 'N/A'} (ID: ${c.patientId})`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
