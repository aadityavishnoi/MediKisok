const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tables = await prisma.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'");
  console.log('TOTAL_TABLES_IN_DB:', tables.length);
  for (const t of tables) {
    console.log('  -', t.table_name);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
