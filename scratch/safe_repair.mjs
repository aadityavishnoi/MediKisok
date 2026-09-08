import fs from 'fs';
import path from 'path';

const schemaPath = path.resolve('apps/backend/prisma/schema.prisma');
let text = fs.readFileSync(schemaPath, 'utf8');

function updateModel(schemaText, modelName, updater) {
  const regex = new RegExp(`(model\\s+${modelName}\\s+\\{)([\\s\\S]*?)(\\n\\})`, 'm');
  const match = schemaText.match(regex);
  if (!match) {
    throw new Error(`Model ${modelName} not found!`);
  }
  const header = match[1];
  const body = match[2];
  const footer = match[3];

  const newBody = updater(body);
  return schemaText.replace(regex, `${header}${newBody}${footer}`);
}

// 1. State
text = updateModel(text, 'State', (b) => {
  if (!b.includes('@@index([nationalAuthorityId])')) {
    b = b + '\n  @@index([nationalAuthorityId])';
  }
  return b;
});

// 2. District
text = updateModel(text, 'District', (b) => {
  if (!b.includes('@@index([stateId])')) {
    b = b + '\n  @@index([stateId])';
  }
  return b;
});

// 3. Hospital
text = updateModel(text, 'Hospital', (b) => {
  b = b.replace(
    /patients\s+Patient\[\]/,
    'patients          Patient[]                     @relation("HospitalPatients")\n  registeredPatients Patient[]                    @relation("RegisteredFacilityPatients")'
  );
  if (!b.includes('@@index([stateId])')) {
    b = b + '\n  @@index([stateId])\n  @@index([districtId])\n  @@index([facilityStatus])';
  }
  return b;
});

// 4. Department
text = updateModel(text, 'Department', (b) => {
  b = b.replace(
    /hospital\s+Hospital\s+@relation\(fields:\s*\[hospitalId\],\s*references:\s*\[id\]\)/,
    'hospital     Hospital         @relation(fields: [hospitalId], references: [id], onDelete: Cascade)'
  );
  if (!b.includes('@@index([hospitalId])')) {
    b = b + '\n  @@index([hospitalId])';
  }
  return b;
});

// 5. Doctor
text = updateModel(text, 'Doctor', (b) => {
  if (!b.includes('@@index([hospitalId])')) {
    b = b + '\n  @@index([hospitalId])\n  @@index([departmentId])\n  @@index([status])';
  }
  return b;
});

// 6. Patient
text = updateModel(text, 'Patient', (b) => {
  b = b.replace(
    /hospital\s+Hospital\?\s+@relation\(fields:\s*\[hospitalId\],\s*references:\s*\[id\]\)/,
    'hospital             Hospital?              @relation("HospitalPatients", fields: [hospitalId], references: [id])\n  registeredFacility   Hospital?              @relation("RegisteredFacilityPatients", fields: [registeredFacilityId], references: [id])'
  );
  if (!b.includes('@@index([hospitalId])')) {
    b = b + '\n  @@index([hospitalId])\n  @@index([registeredFacilityId])\n  @@index([fullName])\n  @@index([createdAt])';
  }
  return b;
});

// 7. RFIDEvent
text = updateModel(text, 'RFIDEvent', (b) => {
  b = b.replace(
    /rfidCard\s+RFIDCard\?\s+@relation\(fields:\s*\[rfidCardId\],\s*references:\s*\[id\]\)/,
    'rfidCard RFIDCard? @relation(fields: [rfidCardId], references: [id], onDelete: Cascade)'
  );
  if (!b.includes('@@index([rfidCardId])')) {
    b = b + '\n  @@index([rfidCardId])';
  }
  return b;
});

// 8. RFIDDevice
text = updateModel(text, 'RFIDDevice', (b) => {
  if (!b.includes('@@index([hospitalId, status])')) {
    b = b + '\n  @@index([hospitalId, status])';
  }
  return b;
});

// 9. PatientSession
text = updateModel(text, 'PatientSession', (b) => {
  if (!b.includes('@@index([patientId, status])')) {
    b = b + '\n  @@index([patientId, status])\n  @@index([hospitalId, status])\n  @@index([deviceId])\n  @@index([departmentId])\n  @@index([createdAt])';
  }
  return b;
});

// 10. Consent
text = updateModel(text, 'Consent', (b) => {
  b = b.replace(
    /session\s+PatientSession\s+@relation\(fields:\s*\[sessionId\],\s*references:\s*\[id\]\)/,
    'session PatientSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)'
  );
  return b;
});

// 11. ClinicalHistory
text = updateModel(text, 'ClinicalHistory', (b) => {
  b = b.replace(
    /session\s+PatientSession\s+@relation\(fields:\s*\[sessionId\],\s*references:\s*\[id\]\)/,
    'session PatientSession   @relation(fields: [sessionId], references: [id], onDelete: Cascade)'
  );
  if (!b.includes('@@index([patientId])')) {
    b = b + '\n  @@index([patientId])';
  }
  return b;
});

// 12. ClinicalAnswer
text = updateModel(text, 'ClinicalAnswer', (b) => {
  b = b.replace(
    /clinicalHistory\s+ClinicalHistory\s+@relation\(fields:\s*\[clinicalHistoryId\],\s*references:\s*\[id\]\)/,
    'clinicalHistory ClinicalHistory @relation(fields: [clinicalHistoryId], references: [id], onDelete: Cascade)'
  );
  if (!b.includes('@@index([clinicalHistoryId])')) {
    b = b + '\n  @@index([clinicalHistoryId])';
  }
  return b;
});

// 13. PatientVitals
text = updateModel(text, 'PatientVitals', (b) => {
  b = b.replace(
    /session\s+PatientSession\s+@relation\(fields:\s*\[sessionId\],\s*references:\s*\[id\]\)/,
    'session PatientSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)'
  );
  if (!b.includes('@@index([patientId])')) {
    b = b + '\n  @@index([patientId])';
  }
  return b;
});

// 14. Question
text = updateModel(text, 'Question', (b) => {
  if (!b.includes('@@index([questionnaireId])')) {
    b = b + '\n  @@index([questionnaireId])';
  }
  return b;
});

// 15. SessionSymptom
text = updateModel(text, 'SessionSymptom', (b) => {
  if (!b.includes('@@index([patientId])')) {
    b = b + '\n  @@index([patientId])';
  }
  return b;
});

// 16. MedicalDocument
text = updateModel(text, 'MedicalDocument', (b) => {
  b = b.replace(
    /session\s+PatientSession\s+@relation\(fields:\s*\[sessionId\],\s*references:\s*\[id\]\)/,
    'session        PatientSession         @relation(fields: [sessionId], references: [id], onDelete: Cascade)'
  );
  if (!b.includes('@@index([patientId])')) {
    b = b + '\n  @@index([patientId])\n  @@index([sessionId])';
  }
  return b;
});

// 17. ExtractedMedicalData
text = updateModel(text, 'ExtractedMedicalData', (b) => {
  b = b.replace(
    /document\s+MedicalDocument\s+@relation\(fields:\s*\[documentId\],\s*references:\s*\[id\]\)/,
    'document MedicalDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)'
  );
  if (!b.includes('@@index([documentId])')) {
    b = b + '\n  @@index([documentId])';
  }
  return b;
});

// 18. OCRJob
text = updateModel(text, 'OCRJob', (b) => {
  if (!b.includes('@@index([sessionId])')) {
    b = b + '\n  @@index([sessionId])';
  }
  return b;
});

// 19. MedicalTimelineEvent
text = updateModel(text, 'MedicalTimelineEvent', (b) => {
  b = b.replace(
    /patient\s+Patient\s+@relation\(fields:\s*\[patientId\],\s*references:\s*\[id\]\)/,
    'patient        Patient          @relation(fields: [patientId], references: [id], onDelete: Cascade)'
  );
  if (!b.includes('@@index([patientId, eventDate])')) {
    b = b + '\n  @@index([patientId, eventDate])\n  @@index([sourceDocumentId])';
  }
  return b;
});

// 20. AISummary
text = updateModel(text, 'AISummary', (b) => {
  b = b.replace(
    /session\s+PatientSession\s+@relation\(fields:\s*\[sessionId\],\s*references:\s*\[id\]\)/,
    'session PatientSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)'
  );
  if (!b.includes('@@index([patientId])')) {
    b = b + '\n  @@index([patientId])';
  }
  return b;
});

// 21. TriageQueue
text = updateModel(text, 'TriageQueue', (b) => {
  b = b.replace(
    /session\s+PatientSession\s+@relation\(fields:\s*\[sessionId\],\s*references:\s*\[id\]\)/,
    'session    PatientSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)'
  );
  if (!b.includes('@@index([patientId])')) {
    b = b + '\n  @@index([patientId])\n  @@index([priority, status])';
  }
  return b;
});

// 22. Consultation
text = updateModel(text, 'Consultation', (b) => {
  if (!b.includes('@@index([patientId])')) {
    b = b + '\n  @@index([patientId])\n  @@index([doctorId, status])';
  }
  return b;
});

// 23. DoctorNote
text = updateModel(text, 'DoctorNote', (b) => {
  if (!b.includes('@@index([doctorId])')) {
    b = b + '\n  @@index([doctorId])';
  }
  return b;
});

// 24. AIAssistance
text = updateModel(text, 'AIAssistance', (b) => {
  if (!b.includes('@@index([consultationId])')) {
    b = b + '\n  @@index([consultationId])';
  }
  return b;
});

// 25. Prescription
text = updateModel(text, 'Prescription', (b) => {
  if (!b.includes('@@index([patientId])')) {
    b = b + '\n  @@index([patientId])\n  @@index([doctorId])';
  }
  return b;
});

// 26. PrescriptionItem
text = updateModel(text, 'PrescriptionItem', (b) => {
  if (!b.includes('@@index([prescriptionId])')) {
    b = b + '\n  @@index([prescriptionId])';
  }
  return b;
});

// 27. Alert
text = updateModel(text, 'Alert', (b) => {
  b = b.replace(
    /session\s+PatientSession\s+@relation\(fields:\s*\[sessionId\],\s*references:\s*\[id\]\)/,
    'session PatientSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)'
  );
  if (!b.includes('@@index([sessionId])')) {
    b = b + '\n  @@index([sessionId])\n  @@index([patientId, acknowledged])';
  }
  return b;
});

// 28. DiseaseOutbreakSignal
text = updateModel(text, 'DiseaseOutbreakSignal', (b) => {
  if (!b.includes('@@index([hospitalId])')) {
    b = b + '\n  @@index([hospitalId])';
  }
  return b;
});

// 29. AbdmConsentArtefact
text = updateModel(text, 'AbdmConsentArtefact', (b) => {
  if (!b.includes('@@index([patientId])')) {
    b = b + '\n  @@index([patientId])';
  }
  return b;
});

// 30. Appointment
text = updateModel(text, 'Appointment', (b) => {
  b = b.replace(
    /invoices\s+BillingInvoice\[\]/,
    'invoices      BillingInvoice[]\n  prescriptions PatientPrescription[]'
  );
  if (!b.includes('@@index([facilityId, status])')) {
    b = b + '\n  @@index([facilityId, status])\n  @@index([departmentId])';
  }
  return b;
});

// 31. BillingInvoice
text = updateModel(text, 'BillingInvoice', (b) => {
  if (!b.includes('@@index([appointmentId])')) {
    b = b + '\n  @@index([appointmentId])';
  }
  return b;
});

// 32. PatientPrescription
text = updateModel(text, 'PatientPrescription', (b) => {
  b = b.replace(
    /doctor\s+Doctor\?\s+@relation\(fields:\s*\[doctorId\],\s*references:\s*\[id\]\)/,
    'doctor      Doctor?      @relation(fields: [doctorId], references: [id])\n  appointment Appointment? @relation(fields: [appointmentId], references: [id])'
  );
  if (!b.includes('@@index([doctorId])')) {
    b = b + '\n  @@index([doctorId])\n  @@index([appointmentId])';
  }
  return b;
});

fs.writeFileSync(schemaPath, text, 'utf8');
console.log('Safe repair applied successfully!');
