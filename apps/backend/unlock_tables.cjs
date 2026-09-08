// unlock-aimodel.cjs  — run once to unlock CockroachDB schema lock on AIModel table
// Uses the existing query_cards.cjs pattern which works
const http = require('http');
const https = require('https');
const url = require('url');

// Parse DATABASE_URL
require('dotenv').config();
const dbUrl = process.env.DATABASE_URL;

console.log('DATABASE_URL prefix:', dbUrl?.slice(0, 30));
console.log('');
console.log('To unlock the schema, run the following SQL in your CockroachDB console:');
console.log('');
console.log('  ALTER TABLE "AIModel" SET (schema_locked = false);');
console.log('  ALTER TABLE "RFIDCard" SET (schema_locked = false);');
console.log('  ALTER TABLE "AuditLog" SET (schema_locked = false);');
console.log('');
console.log('Then re-run: npx prisma db push --schema=../../prisma/schema.prisma');
