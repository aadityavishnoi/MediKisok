import { prisma } from './lib/prisma.js';

async function main() {
  const count = await prisma.rFIDCard.count();
  const cards = await prisma.rFIDCard.findMany({
    include: { patient: true },
    take: 10,
  });
  console.log(`TOTAL_CARDS_COUNT: ${count}`);
  console.log('SAMPLE_CARDS:', JSON.stringify(cards, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
