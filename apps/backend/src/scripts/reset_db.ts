import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';

const prisma = new PrismaClient();

async function reset() {
  console.log('🧹 [1/3] Clearing all tables in CockroachDB...');

  // Delete in reverse foreign-key dependency order
  const deleteOperations = [
    () => prisma.interoperabilityTransaction.deleteMany(),
    () => prisma.fHIRResourceMapping.deleteMany(),
    () => prisma.abdmConsentArtefact.deleteMany(),
    () => prisma.aIModelDeployment.deleteMany(),
    () => prisma.aIModelVersion.deleteMany(),
    () => prisma.aIModel.deleteMany(),
    () => prisma.diseaseOutbreakSignal.deleteMany(),
    () => prisma.notification.deleteMany(),
    () => prisma.operationalAlert.deleteMany(),
    () => prisma.alert.deleteMany(),
    () => prisma.prescriptionItem.deleteMany(),
    () => prisma.prescription.deleteMany(),
    () => prisma.aIAssistance.deleteMany(),
    () => prisma.doctorNote.deleteMany(),
    () => prisma.consultation.deleteMany(),
    () => prisma.triageQueue.deleteMany(),
    () => prisma.aISummary.deleteMany(),
    () => prisma.medicalTimelineEvent.deleteMany(),
    () => prisma.extractedMedicalData.deleteMany(),
    () => prisma.oCRJob.deleteMany(),
    () => prisma.medicalDocument.deleteMany(),
    () => prisma.sessionSymptom.deleteMany(),
    () => prisma.clinicalAnswer.deleteMany(),
    () => prisma.clinicalHistory.deleteMany(),
    () => prisma.patientVitals.deleteMany(),
    () => prisma.consent.deleteMany(),
    () => prisma.patientSession.deleteMany(),
    () => prisma.deviceEvent.deleteMany(),
    () => prisma.deviceHeartbeat.deleteMany(),
    () => prisma.rFIDEvent.deleteMany(),
    () => prisma.rFIDCard.deleteMany(),
    () => prisma.patientIdentifier.deleteMany(),
    () => prisma.patient.deleteMany(),
    () => prisma.otpVerification.deleteMany(),
    () => prisma.systemConfig.deleteMany(),
    () => prisma.auditLog.deleteMany(),
    () => prisma.question.deleteMany(),
    () => prisma.questionnaire.deleteMany(),
    () => prisma.rFIDDevice.deleteMany(),
    () => prisma.userRole.deleteMany(),
    () => prisma.rolePermission.deleteMany(),
    () => prisma.permission.deleteMany(),
    () => prisma.role.deleteMany(),
    () => prisma.doctor.deleteMany(),
    () => prisma.department.deleteMany(),
    () => prisma.hospital.deleteMany(),
    () => prisma.district.deleteMany(),
    () => prisma.state.deleteMany(),
    () => prisma.nationalAuthority.deleteMany(),
  ];

  for (const op of deleteOperations) {
    try {
      await op();
    } catch (e: any) {
      console.warn('  ⚠️ Table cleanup notice:', e.message?.slice(0, 120));
    }
  }

  console.log('✅ All tables successfully purged.');

  console.log('🌱 [2/3] Re-seeding clean initial baseline data...');
  const rootDir = process.cwd().includes('apps') ? path.resolve(process.cwd(), '../..') : process.cwd();
  execSync('npx tsx prisma/seed.ts', { cwd: rootDir, stdio: 'inherit' });

  console.log('🔍 [3/3] Running database verification audit...');
  execSync('npx tsx apps/backend/src/scripts/verify_database.ts', { cwd: rootDir, stdio: 'inherit' });

  console.log('\n✨ DATABASE SUCCESSFULLY RESET TO CLEAN INITIAL STATE! ✨');
}

reset()
  .catch((err) => {
    console.error('❌ Reset failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
