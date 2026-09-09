const path = require('path');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: path.join(__dirname, 'apps/backend/.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to DB...');
  const patients = await prisma.patient.findMany({ select: { id: true, fullName: true, phone: true } });
  console.log('Total Patients:', patients.length, patients);

  const doctors = await prisma.doctor.findMany({ select: { id: true, name: true, departmentId: true } });
  console.log('Total Doctors:', doctors.length, doctors);

  const depts = await prisma.department.findMany({ select: { id: true, name: true, code: true } });
  console.log('Total Departments:', depts.length, depts);

  const hospitals = await prisma.hospital.findMany({ select: { id: true, name: true } });
  console.log('Total Hospitals:', hospitals.length, hospitals);

  const demoPatient = await prisma.patient.findUnique({ where: { id: 'demo-patient-001' } });
  console.log('demo-patient-001 in DB:', demoPatient);

  const doc01 = await prisma.doctor.findUnique({ where: { id: 'DOC-01' } });
  console.log('DOC-01 in DB:', doc01);

  const deptCardio = await prisma.department.findUnique({ where: { id: 'dept-cardio' } });
  console.log('dept-cardio in DB:', deptCardio);
}

main()
  .catch(err => console.error('Error:', err))
  .finally(() => prisma.$disconnect());
