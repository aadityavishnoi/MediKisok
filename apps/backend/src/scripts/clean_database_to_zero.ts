import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Models in strict reverse foreign-key dependency order
// (Child tables deleted before parent tables)
const DELETION_ORDER = [
  // Level 1: Deepest child / leaf log / clinical / transactional records
  { modelName: 'PatientPrescription', deleteFn: () => prisma.patientPrescription.deleteMany(), countFn: () => prisma.patientPrescription.count() },
  { modelName: 'PrescriptionItem', deleteFn: () => prisma.prescriptionItem.deleteMany(), countFn: () => prisma.prescriptionItem.count() },
  { modelName: 'Prescription', deleteFn: () => prisma.prescription.deleteMany(), countFn: () => prisma.prescription.count() },
  { modelName: 'DoctorNote', deleteFn: () => prisma.doctorNote.deleteMany(), countFn: () => prisma.doctorNote.count() },
  { modelName: 'AIAssistance', deleteFn: () => prisma.aIAssistance.deleteMany(), countFn: () => prisma.aIAssistance.count() },
  { modelName: 'BillingInvoice', deleteFn: () => prisma.billingInvoice.deleteMany(), countFn: () => prisma.billingInvoice.count() },
  { modelName: 'Appointment', deleteFn: () => prisma.appointment.deleteMany(), countFn: () => prisma.appointment.count() },
  { modelName: 'Consultation', deleteFn: () => prisma.consultation.deleteMany(), countFn: () => prisma.consultation.count() },
  { modelName: 'TriageQueue', deleteFn: () => prisma.triageQueue.deleteMany(), countFn: () => prisma.triageQueue.count() },
  { modelName: 'AISummary', deleteFn: () => prisma.aISummary.deleteMany(), countFn: () => prisma.aISummary.count() },
  { modelName: 'ClinicalAnswer', deleteFn: () => prisma.clinicalAnswer.deleteMany(), countFn: () => prisma.clinicalAnswer.count() },
  { modelName: 'ClinicalHistory', deleteFn: () => prisma.clinicalHistory.deleteMany(), countFn: () => prisma.clinicalHistory.count() },
  { modelName: 'ExtractedMedicalData', deleteFn: () => prisma.extractedMedicalData.deleteMany(), countFn: () => prisma.extractedMedicalData.count() },
  { modelName: 'OCRJob', deleteFn: () => prisma.oCRJob.deleteMany(), countFn: () => prisma.oCRJob.count() },
  { modelName: 'MedicalTimelineEvent', deleteFn: () => prisma.medicalTimelineEvent.deleteMany(), countFn: () => prisma.medicalTimelineEvent.count() },
  { modelName: 'MedicalDocument', deleteFn: () => prisma.medicalDocument.deleteMany(), countFn: () => prisma.medicalDocument.count() },
  { modelName: 'SessionSymptom', deleteFn: () => prisma.sessionSymptom.deleteMany(), countFn: () => prisma.sessionSymptom.count() },
  { modelName: 'PatientVitals', deleteFn: () => prisma.patientVitals.deleteMany(), countFn: () => prisma.patientVitals.count() },
  { modelName: 'Consent', deleteFn: () => prisma.consent.deleteMany(), countFn: () => prisma.consent.count() },
  { modelName: 'Alert', deleteFn: () => prisma.alert.deleteMany(), countFn: () => prisma.alert.count() },
  { modelName: 'RFIDEvent', deleteFn: () => prisma.rFIDEvent.deleteMany(), countFn: () => prisma.rFIDEvent.count() },
  { modelName: 'DeviceHeartbeat', deleteFn: () => prisma.deviceHeartbeat.deleteMany(), countFn: () => prisma.deviceHeartbeat.count() },
  { modelName: 'DeviceEvent', deleteFn: () => prisma.deviceEvent.deleteMany(), countFn: () => prisma.deviceEvent.count() },
  { modelName: 'OperationalAlert', deleteFn: () => prisma.operationalAlert.deleteMany(), countFn: () => prisma.operationalAlert.count() },
  { modelName: 'PatientNotification', deleteFn: () => prisma.patientNotification.deleteMany(), countFn: () => prisma.patientNotification.count() },
  { modelName: 'AbdmConsentArtefact', deleteFn: () => prisma.abdmConsentArtefact.deleteMany(), countFn: () => prisma.abdmConsentArtefact.count() },
  { modelName: 'PatientIdentifier', deleteFn: () => prisma.patientIdentifier.deleteMany(), countFn: () => prisma.patientIdentifier.count() },
  { modelName: 'RFIDCard', deleteFn: () => prisma.rFIDCard.deleteMany(), countFn: () => prisma.rFIDCard.count() },
  { modelName: 'PatientSession', deleteFn: () => prisma.patientSession.deleteMany(), countFn: () => prisma.patientSession.count() },
  { modelName: 'Patient', deleteFn: () => prisma.patient.deleteMany(), countFn: () => prisma.patient.count() },

  // Level 2: Auxiliary / Operational / Configuration entities
  { modelName: 'Question', deleteFn: () => prisma.question.deleteMany(), countFn: () => prisma.question.count() },
  { modelName: 'Questionnaire', deleteFn: () => prisma.questionnaire.deleteMany(), countFn: () => prisma.questionnaire.count() },
  { modelName: 'DiseaseOutbreakSignal', deleteFn: () => prisma.diseaseOutbreakSignal.deleteMany(), countFn: () => prisma.diseaseOutbreakSignal.count() },
  { modelName: 'AIModelDeployment', deleteFn: () => prisma.aIModelDeployment.deleteMany(), countFn: () => prisma.aIModelDeployment.count() },
  { modelName: 'AIModelVersion', deleteFn: () => prisma.aIModelVersion.deleteMany(), countFn: () => prisma.aIModelVersion.count() },
  { modelName: 'AIModel', deleteFn: () => prisma.aIModel.deleteMany(), countFn: () => prisma.aIModel.count() },
  { modelName: 'FHIRResourceMapping', deleteFn: () => prisma.fHIRResourceMapping.deleteMany(), countFn: () => prisma.fHIRResourceMapping.count() },
  { modelName: 'InteroperabilityTransaction', deleteFn: () => prisma.interoperabilityTransaction.deleteMany(), countFn: () => prisma.interoperabilityTransaction.count() },
  { modelName: 'AuditLog', deleteFn: () => prisma.auditLog.deleteMany(), countFn: () => prisma.auditLog.count() },
  { modelName: 'Notification', deleteFn: () => prisma.notification.deleteMany(), countFn: () => prisma.notification.count() },
  { modelName: 'OtpVerification', deleteFn: () => prisma.otpVerification.deleteMany(), countFn: () => prisma.otpVerification.count() },
  { modelName: 'SystemConfig', deleteFn: () => prisma.systemConfig.deleteMany(), countFn: () => prisma.systemConfig.count() },

  // Level 3: Roles, Staff, Devices & Department entities
  { modelName: 'UserRole', deleteFn: () => prisma.userRole.deleteMany(), countFn: () => prisma.userRole.count() },
  { modelName: 'RolePermission', deleteFn: () => prisma.rolePermission.deleteMany(), countFn: () => prisma.rolePermission.count() },
  { modelName: 'Role', deleteFn: () => prisma.role.deleteMany(), countFn: () => prisma.role.count() },
  { modelName: 'Permission', deleteFn: () => prisma.permission.deleteMany(), countFn: () => prisma.permission.count() },
  { modelName: 'RFIDDevice', deleteFn: () => prisma.rFIDDevice.deleteMany(), countFn: () => prisma.rFIDDevice.count() },
  { modelName: 'Doctor', deleteFn: () => prisma.doctor.deleteMany(), countFn: () => prisma.doctor.count() },
  { modelName: 'Department', deleteFn: () => prisma.department.deleteMany(), countFn: () => prisma.department.count() },

  // Level 4: Administrative Geography & Tenant Root
  { modelName: 'Hospital', deleteFn: () => prisma.hospital.deleteMany(), countFn: () => prisma.hospital.count() },
  { modelName: 'District', deleteFn: () => prisma.district.deleteMany(), countFn: () => prisma.district.count() },
  { modelName: 'State', deleteFn: () => prisma.state.deleteMany(), countFn: () => prisma.state.count() },
  { modelName: 'NationalAuthority', deleteFn: () => prisma.nationalAuthority.deleteMany(), countFn: () => prisma.nationalAuthority.count() },
];

async function main() {
  const startTime = Date.now();
  const args = process.argv.slice(2);
  const isConfirmed = process.env.CONFIRM_ZERO_RESET === 'true' || args.includes('--confirm');

  console.log('================================================================');
  console.log('       MEDIKIOSK — SAFE ZERO DATABASE RESET UTILITY           ');
  console.log('================================================================');

  if (!isConfirmed) {
    console.error(`
[SAFETY LOCK ENGAGED]
This operation will PURGE ALL operational and business data from the database.
Prisma schemas, tables, indexes, constraints, and migrations will remain intact.

To execute this clean reset, you must explicitly confirm by setting:
  CONFIRM_ZERO_RESET=true pnpm run db:reset:zero
or:
  pnpm run db:reset:zero -- --confirm

ABORTED. No records were deleted.
`);
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL || '';
  const maskedDbUrl = dbUrl.replace(/:\/\/[^@]+@/, '://***:***@');
  console.log(`Target Database: ${maskedDbUrl || '(configured via env)'}`);
  console.log(`Mode: MODE A (Zero Business Data — Clean Reset)`);
  console.log(`Total Prisma Models in Datamodel: ${DELETION_ORDER.length}`);
  console.log('----------------------------------------------------------------\n');

  console.log('🧹 Purging records in topological reverse foreign-key dependency order...');

  const auditResults: Array<{ model: string; deleted: number; finalCount: number; status: string }> = [];
  let totalDeleted = 0;

  for (const entry of DELETION_ORDER) {
    try {
      const deleteResult = await entry.deleteFn();
      const count = typeof deleteResult === 'object' && deleteResult !== null && 'count' in deleteResult 
        ? (deleteResult as { count: number }).count 
        : 0;
      
      const finalCount = await entry.countFn();
      totalDeleted += count;

      auditResults.push({
        model: entry.modelName,
        deleted: count,
        finalCount,
        status: finalCount === 0 ? 'VERIFIED_ZERO' : 'FAILED',
      });

      process.stdout.write(`  ✓ ${entry.modelName.padEnd(28)} Deleted: ${String(count).padStart(4)} | Count: ${finalCount}\n`);
    } catch (err: any) {
      console.error(`  ❌ Failed to purge ${entry.modelName}:`, err.message);
      auditResults.push({
        model: entry.modelName,
        deleted: -1,
        finalCount: -1,
        status: `ERROR: ${err.message?.slice(0, 40)}`,
      });
    }
  }

  const durationMs = Date.now() - startTime;
  const allZero = auditResults.every((r) => r.finalCount === 0);

  console.log('\n================================================================');
  console.log('              POST-RESET AUDIT & VERIFICATION REPORT            ');
  console.log('================================================================');
  console.log(`| ${'Model / Table'.padEnd(28)} | ${'Purged'.padStart(8)} | ${'Remaining'.padStart(9)} | ${'Status'.padEnd(14)} |`);
  console.log(`|------------------------------|----------|-----------|----------------|`);

  for (const r of auditResults) {
    console.log(`| ${r.model.padEnd(28)} | ${String(r.deleted).padStart(8)} | ${String(r.finalCount).padStart(9)} | ${r.status.padEnd(14)} |`);
  }

  console.log('================================================================');
  console.log(`Total Records Purged: ${totalDeleted}`);
  console.log(`Total Tables Audited: ${auditResults.length} / 53`);
  console.log(`Execution Elapsed Time: ${(durationMs / 1000).toFixed(2)}s`);
  console.log(`Schema Integrity: 100% INTACT (No tables, relations, or indexes dropped)`);

  if (allZero) {
    console.log(`\n Target State Achieved: VALID SCHEMA + ZERO BUSINESS DATA`);
    console.log(`  All MediKiosk portals will now display clean zero/empty states.`);
    console.log(`  To re-populate baseline dev data, run MODE B: pnpm --filter backend prisma db seed\n`);
  } else {
    console.error(`\n⚠️ Some tables could not be verified at count 0. Check foreign key constraints.\n`);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('Fatal error during zero reset:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
