const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf8');
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  const k = parts[0];
  const v = parts.slice(1).join('=');
  if (k && v) process.env[k.trim()] = v.trim().replace(/^['"]|['"]$/g, '');
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const patients = await prisma.patient.findMany({ select: { id: true, fullName: true, phone: true } });
  console.log('Total Patients:', patients.length, JSON.stringify(patients, null, 2));

  const doctors = await prisma.doctor.findMany({ select: { id: true, name: true, departmentId: true, hospitalId: true } });
  console.log('Total Doctors:', doctors.length, JSON.stringify(doctors, null, 2));

  const depts = await prisma.department.findMany({ select: { id: true, name: true, code: true, hospitalId: true } });
  console.log('Total Departments:', depts.length, JSON.stringify(depts, null, 2));

  const hospitals = await prisma.hospital.findMany({ select: { id: true, name: true } });
  console.log('Total Hospitals:', hospitals.length, JSON.stringify(hospitals, null, 2));

  const demoPatient = await prisma.patient.findUnique({ where: { id: 'demo-patient-001' } });
  console.log('demo-patient-001 in DB:', !!demoPatient);

  const doc01 = await prisma.doctor.findUnique({ where: { id: 'DOC-01' } });
  console.log('DOC-01 in DB:', !!doc01);

  const deptCardio = await prisma.department.findUnique({ where: { id: 'dept-cardio' } });
  console.log('dept-cardio in DB:', !!deptCardio);
}

main().catch(console.error).finally(() => prisma.$disconnect());
