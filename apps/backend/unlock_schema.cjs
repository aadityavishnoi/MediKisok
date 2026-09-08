// unlock_schema.cjs — unlocks all CockroachDB schema-locked tables dynamically
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all tables in public schema...');
  try {
    const rows = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    
    for (const r of rows) {
      const tableName = r.table_name;
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "${tableName}" SET (schema_locked = false)`);
        console.log(`✓ Unlocked ${tableName}`);
      } catch (e) {
        // Ignore if not locked or cannot be unlocked
        console.log(`  ${tableName}: ${e.message?.split('\n')[0]}`);
      }
    }
  } catch (err) {
    console.error('Failed to query tables:', err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
