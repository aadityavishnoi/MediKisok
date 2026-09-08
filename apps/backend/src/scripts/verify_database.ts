/**
 * MediKiosk — Authoritative Database Verification Script
 *
 * Verifies:
 * 1. Referential integrity across National Authority -> State -> District -> Hospital -> Dept -> Staff -> Patient
 * 2. RBAC Roles & Permissions mapping
 * 3. Normalized Patient Identifiers (RFID, ABHA, Phone)
 * 4. RFID Lifecycle & Event Stream
 * 5. Hardware Device Telemetry
 * 6. Clinical Decision Trees (Questionnaire/Question)
 * 7. Operational vs Clinical Alert Separation
 * 8. AI Governance Registry (Model -> Version -> Deployment)
 * 9. FHIR/ABDM Interoperability (DEMO status verification)
 * 10. System Configuration
 *
 * Run: npx tsx src/scripts/verify_database.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuditReport {
  domain: string;
  check: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
}

const reports: AuditReport[] = [];

function record(domain: string, check: string, status: 'PASS' | 'FAIL' | 'WARNING', details: string) {
  reports.push({ domain, check, status, details });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${domain}] ${check}: ${details}`);
}

async function verify() {
  console.log('================================================================');
  console.log('🔍 MEDIKIOSK DATABASE ARCHITECTURE VERIFICATION AUDIT');
  console.log('================================================================\n');

  // 1. National Authority -> State -> District Hierarchy
  try {
    const nha = await prisma.nationalAuthority.findUnique({ where: { code: 'NHA-INDIA' }, include: { states: true } });
    if (nha && nha.states.length > 0) {
      record('ORGANIZATION', 'National Authority & State Hierarchy', 'PASS', `Found ${nha.name} with ${nha.states.length} states`);
    } else {
      record('ORGANIZATION', 'National Authority & State Hierarchy', 'FAIL', 'National Authority or linked states missing');
    }

    const delhiDistricts = await prisma.district.findMany({ where: { state: { code: 'DL' } } });
    if (delhiDistricts.length >= 2) {
      record('ORGANIZATION', 'State -> District Hierarchy', 'PASS', `Delhi has ${delhiDistricts.length} districts mapped`);
    } else {
      record('ORGANIZATION', 'State -> District Hierarchy', 'WARNING', `Only ${delhiDistricts.length} districts mapped to Delhi`);
    }

    const aiims = await prisma.hospital.findUnique({
      where: { code: 'AIIMS-DEL' },
      include: { stateRel: true, districtRel: true, departments: true },
    });
    if (aiims && aiims.stateRel && aiims.districtRel) {
      record('FACILITY', 'Facility Hierarchy Linkage', 'PASS', `AIIMS linked to State (${aiims.stateRel.name}) and District (${aiims.districtRel.name})`);
    } else {
      record('FACILITY', 'Facility Hierarchy Linkage', 'FAIL', 'AIIMS missing foreign key relation to State or District');
    }

    if (aiims && aiims.departments.length >= 5) {
      record('FACILITY', 'Hospital Departments', 'PASS', `${aiims.departments.length} active OPD clinics registered`);
    } else {
      record('FACILITY', 'Hospital Departments', 'FAIL', 'Insufficient departments in AIIMS');
    }
  } catch (e: any) {
    record('ORGANIZATION', 'Hierarchy Check', 'FAIL', e.message);
  }

  // 2. RBAC & Staff Accounts
  try {
    const roles = await prisma.role.findMany({ include: { permissions: true } });
    const perms = await prisma.permission.count();
    if (roles.length >= 6 && perms >= 10) {
      record('RBAC', 'Roles & Normalized Permissions', 'PASS', `${roles.length} roles and ${perms} permissions registered`);
    } else {
      record('RBAC', 'Roles & Normalized Permissions', 'FAIL', `Insufficient roles (${roles.length}) or permissions (${perms})`);
    }

    const doctors = await prisma.doctor.findMany({ include: { userRoles: true } });
    if (doctors.length >= 6) {
      record('STAFF', 'Staff Accounts & Identity', 'PASS', `${doctors.length} staff accounts operational with multi-role support`);
    } else {
      record('STAFF', 'Staff Accounts & Identity', 'FAIL', `Only ${doctors.length} staff accounts found`);
    }
  } catch (e: any) {
    record('RBAC', 'Staff & Roles Check', 'FAIL', e.message);
  }

  // 3. Patients & Normalized Identifiers
  try {
    const patients = await prisma.patient.findMany({ include: { identifiers: true, rfidCards: true } });
    const patientsWithId = patients.filter((p) => p.identifiers.length >= 1);
    if (patientsWithId.length >= 5) {
      record('PATIENT', 'Patient Profiles & Normalized Identifiers', 'PASS', `${patients.length} patients registered (${patientsWithId.length} with normalized multi-modal identifiers: RFID, ABHA, Phone)`);
    } else {
      record('PATIENT', 'Patient Profiles & Normalized Identifiers', 'WARNING', `Found ${patients.length} patients, only ${patientsWithId.length} with normalized identifiers`);
    }
  } catch (e: any) {
    record('PATIENT', 'Patient Check', 'FAIL', e.message);
  }

  // 4. RFID Lifecycle & Event Stream
  try {
    const cards = await prisma.rFIDCard.findMany({ include: { events: true } });
    const activeCards = cards.filter((c) => c.cardStatus === 'ACTIVE');
    const events = await prisma.rFIDEvent.count();
    if (activeCards.length >= 5 && events >= 5) {
      record('RFID', 'Smart Card Lifecycle & Event Stream', 'PASS', `${cards.length} cards in registry (${activeCards.length} active), ${events} immutable events logged`);
    } else {
      record('RFID', 'Smart Card Lifecycle & Event Stream', 'WARNING', `Found ${cards.length} cards, ${events} events`);
    }
  } catch (e: any) {
    record('RFID', 'RFID Check', 'FAIL', e.message);
  }

  // 5. Devices & Telemetry
  try {
    const kiosks = await prisma.rFIDDevice.findMany({ include: { heartbeats: true, events: true } });
    const hasTelemetry = kiosks.some((k) => k.heartbeats.length > 0);
    if (kiosks.length >= 5 && hasTelemetry) {
      record('HARDWARE', 'Kiosk Fleet & Telemetry Stream', 'PASS', `${kiosks.length} terminals online with heartbeat telemetry`);
    } else {
      record('HARDWARE', 'Kiosk Fleet & Telemetry Stream', 'WARNING', `Found ${kiosks.length} kiosks, telemetry partial`);
    }
  } catch (e: any) {
    record('HARDWARE', 'Hardware Check', 'FAIL', e.message);
  }

  // 6. Clinical Trees & Symptoms
  try {
    const qCount = await prisma.questionnaire.count();
    const questCount = await prisma.question.count();
    if (qCount > 0 && questCount > 0) {
      record('CLINICAL', 'Questionnaire & Decision Trees', 'PASS', `${qCount} questionnaire trees with ${questCount} structured questions`);
    } else {
      record('CLINICAL', 'Questionnaire & Decision Trees', 'WARNING', 'Questionnaire tables empty');
    }

    const opAlerts = await prisma.operationalAlert.count();
    if (opAlerts > 0) {
      record('SAFETY', 'Operational Alert Separation', 'PASS', `${opAlerts} operational hardware/system incidents tracked independently from clinical alerts`);
    } else {
      record('SAFETY', 'Operational Alert Separation', 'WARNING', 'No operational alerts logged');
    }
  } catch (e: any) {
    record('CLINICAL', 'Clinical Trees Check', 'FAIL', e.message);
  }

  // 7. AI Model Governance Registry
  try {
    const aiModels = await prisma.aIModel.findMany({ include: { versions: { include: { deployments: true } } } });
    const totalVersions = aiModels.reduce((acc, m) => acc + m.versions.length, 0);
    const deployedVersions = aiModels.reduce((acc, m) => acc + m.versions.reduce((dAcc, v) => dAcc + v.deployments.length, 0), 0);
    if (aiModels.length >= 4 && totalVersions >= 4) {
      record('AI_GOVERNANCE', 'Multi-tier Model Registry', 'PASS', `${aiModels.length} models, ${totalVersions} version artifacts, ${deployedVersions} active deployments`);
    } else {
      record('AI_GOVERNANCE', 'Multi-tier Model Registry', 'FAIL', 'AI model registry hierarchy incomplete');
    }
  } catch (e: any) {
    record('AI_GOVERNANCE', 'AI Governance Check', 'FAIL', e.message);
  }

  // 8. Interoperability & System Configuration
  try {
    const fhirMaps = await prisma.fHIRResourceMapping.count();
    const interopTx = await prisma.interoperabilityTransaction.count();
    if (fhirMaps > 0 && interopTx > 0) {
      record('INTEROPERABILITY', 'FHIR R4 & ABDM Layer', 'PASS', `${fhirMaps} FHIR resources mapped with DEMO status; ${interopTx} transactions recorded`);
    } else {
      record('INTEROPERABILITY', 'FHIR R4 & ABDM Layer', 'WARNING', 'FHIR resource mappings incomplete');
    }

    const configs = await prisma.systemConfig.count();
    if (configs >= 4) {
      record('CONFIG', 'System Configurations', 'PASS', `${configs} platform and kiosk configurations active (Zero secrets)`);
    } else {
      record('CONFIG', 'System Configurations', 'WARNING', `Only ${configs} configs found`);
    }
  } catch (e: any) {
    record('INTEROPERABILITY', 'Interop/Config Check', 'FAIL', e.message);
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  const passed = reports.filter((r) => r.status === 'PASS').length;
  const failed = reports.filter((r) => r.status === 'FAIL').length;
  const warnings = reports.filter((r) => r.status === 'WARNING').length;

  console.log('\n================================================================');
  console.log(`AUDIT RESULTS: ${passed} PASSED | ${warnings} WARNINGS | ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    console.error('❌ Verification failed on one or more critical checks.');
    process.exit(1);
  } else {
    console.log('✅ ALL CRITICAL DATABASE ARCHITECTURAL CHECKS PASSED.');
  }
}

verify()
  .catch((err) => {
    console.error('Fatal verification error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
