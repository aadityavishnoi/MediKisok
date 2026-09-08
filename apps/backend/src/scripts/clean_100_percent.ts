/**
 * 100% Clean DB Purge Script
 * Wipes ALL patient data, RFID cards, sessions, queues, alerts, outbreak signals,
 * and consultation records while keeping the foundational hospital & staff infrastructure.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clean100Percent() {
  console.log('🧹 Purging 100% of clinical, patient, RFID, and operational records...');

  // Delete all patient and session dependents in order
  await prisma.interoperabilityTransaction.deleteMany();
  await prisma.fHIRResourceMapping.deleteMany();
  await prisma.abdmConsentArtefact.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.diseaseOutbreakSignal.deleteMany();
  await prisma.operationalAlert.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.aIAssistance.deleteMany();
  await prisma.doctorNote.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.triageQueue.deleteMany();
  await prisma.aISummary.deleteMany();
  await prisma.medicalTimelineEvent.deleteMany();
  await prisma.extractedMedicalData.deleteMany();
  await prisma.oCRJob.deleteMany();
  await prisma.medicalDocument.deleteMany();
  await prisma.sessionSymptom.deleteMany();
  await prisma.clinicalAnswer.deleteMany();
  await prisma.clinicalHistory.deleteMany();
  await prisma.patientVitals.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.patientSession.deleteMany();
  await prisma.rFIDEvent.deleteMany();
  await prisma.rFIDCard.deleteMany();
  await prisma.patientIdentifier.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.otpVerification.deleteMany();
  await prisma.auditLog.deleteMany();

  console.log('\n========================================');
  console.log('📊 VERIFYING 100% CLEAN DATABASE COUNTS');
  console.log('========================================');
  const counts = {
    patients: await prisma.patient.count(),
    patientIdentifiers: await prisma.patientIdentifier.count(),
    rfidCards: await prisma.rFIDCard.count(),
    rfidEvents: await prisma.rFIDEvent.count(),
    sessions: await prisma.patientSession.count(),
    triageQueues: await prisma.triageQueue.count(),
    alerts: await prisma.alert.count(),
    operationalAlerts: await prisma.operationalAlert.count(),
    consultations: await prisma.consultation.count(),
    prescriptions: await prisma.prescription.count(),
    diseaseOutbreakSignals: await prisma.diseaseOutbreakSignal.count(),
    medicalDocuments: await prisma.medicalDocument.count(),
    auditLogs: await prisma.auditLog.count(),
  };

  for (const [key, val] of Object.entries(counts)) {
    console.log(`  ${key.padEnd(25)}: ${val}`);
  }

  console.log('\nInfrastructure Status (Ready for New Patients):');
  console.log(`  Hospitals                : ${await prisma.hospital.count()} (AIIMS New Delhi)`);
  console.log(`  Departments              : ${await prisma.department.count()} (Cardiology, General Medicine, etc.)`);
  console.log(`  Staff Logins             : ${await prisma.doctor.count()} (demo.doctor, admin, rfid, central)`);
  console.log(`  Kiosks Online            : ${await prisma.rFIDDevice.count()}`);
  console.log(`  Questionnaires Active    : ${await prisma.questionnaire.count()}`);

  console.log('\n✨ DATABASE IS NOW 100% CLEAN AND READY FOR INITIAL TESTING! ✨');
}

clean100Percent()
  .catch((err) => {
    console.error('❌ Clean failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
