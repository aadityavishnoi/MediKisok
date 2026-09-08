import fs from 'fs';
const envContent = fs.readFileSync('apps/backend/.env', 'utf8');
envContent.split('\n').forEach(l => {
  const [k, ...rest] = l.split('=');
  if (k && rest.length > 0) process.env[k.trim()] = rest.join('=').trim().replace(/^"|"$/g, '');
});
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const patients = await prisma.patient.findMany({
    select: { id: true, hospitalId: true, registeredFacilityId: true, fullName: true }
  });
  console.log('Total patients:', patients.length);
  console.log('Sample patients:');
  console.log(patients.slice(0, 10));

  const facilitiesInPatients = [...new Set(patients.map(p => p.registeredFacilityId).filter(Boolean))];
  console.log('Distinct registeredFacilityIds in Patient:', facilitiesInPatients);

  const hospitalIdsInPatients = [...new Set(patients.map(p => p.hospitalId).filter(Boolean))];
  console.log('Distinct hospitalIds in Patient:', hospitalIdsInPatients);

  const hospitals = await prisma.hospital.findMany({ select: { id: true, code: true, name: true } });
  console.log('Hospitals in DB:');
  console.log(hospitals);

  await prisma.$disconnect();
}
check();
