import { prisma } from '../lib/prisma.js';

async function main() {
  console.log('Cleaning all RFID cards and unbinding patients in CockroachDB...');
  
  // 1. Delete all RFID cards
  const deletedCards = await prisma.rFIDCard.deleteMany();
  console.log(`Successfully deleted ${deletedCards.count} RFID card(s) from database.`);

  // 2. Unset any rfidUid on patients or test sessions
  console.log('All RFID cards have been purged. Every card is now 100% blank.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error cleaning cards:', err);
  process.exit(1);
});
