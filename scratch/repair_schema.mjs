import fs from 'fs';
import path from 'path';

const schemaPath = path.resolve('apps/backend/prisma/schema.prisma');
let s = fs.readFileSync(schemaPath, 'utf8');

// 1. State: add @@index([nationalAuthorityId])
if (!s.includes('@@index([nationalAuthorityId])')) {
  s = s.replace(
    /model State \{([\s\S]*?)\}/,
    (m) => m.replace(/\}\s*$/, '  @@index([nationalAuthorityId])\n}')
  );
}

// 2. District: add @@index([stateId])
if (!s.includes('@@index([stateId])')) {
  s = s.replace(
    /model District \{([\s\S]*?)\}/,
    (m) => m.replace(/\}\s*$/, '  @@index([stateId])\n}')
  );
}

// 3. Hospital:
// - patients Patient[] @relation("HospitalPatients")
// - registeredPatients Patient[] @relation("RegisteredFacilityPatients")
// - @@index([stateId]), @@index([districtId]), @@index([facilityStatus])
if (!s.includes('@relation("HospitalPatients")')) {
  s = s.replace(
    /patients\s+Patient\[\]/,
    'patients          Patient[]                     @relation("HospitalPatients")\n  registeredPatients Patient[]                    @relation("RegisteredFacilityPatients")'
  );
}
if (!s.includes('@@index([facilityStatus])')) {
  s = s.replace(
    /model Hospital \{([\s\S]*?)\}/,
    (m) => m.replace(/\}\s*$/, '  @@index([stateId])\n  @@index([districtId])\n  @@index([facilityStatus])\n}')
  );
}

// 4. Department:
// - hospital Hospital @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
// - @@index([hospitalId])
s = s.replace(
  /hospital\s+Hospital\s+@relation\(fields:\s*\[hospitalId\],\s*references:\s*\[id\]\)/,
  'hospital     Hospital         @relation(fields: [hospitalId], references: [id], onDelete: Cascade)'
);
if (!s.includes('@@index([hospitalId])')) {
  s = s.replace(
    /model Department \{([\s\S]*?)\}/,
    (m) => m.replace(/\}\s*$/, '  @@index([hospitalId])\n}')
  );
}

// 5. Doctor:
// - @@index([hospitalId]), @@index([departmentId]), @@index([status])
if (!s.includes('@@index([hospitalId])')) {
  s = s.replace(
    /model Doctor \{([\s\S]*?)\}/,
    (m) => m.replace(/\}\s*$/, '  @@index([hospitalId])\n  @@index([departmentId])\n  @@index([status])\n}')
  );
}

// 6. Patient:
// - hospital Hospital? @relation("HospitalPatients", fields: [hospitalId], references: [id])
// - registeredFacility Hospital? @relation("RegisteredFacilityPatients", fields: [registeredFacilityId], references: [id])
// - @@index([hospitalId]), @@index([registeredFacilityId]), @@index([fullName]), @@index([phone])
s = s.replace(
  /hospital\s+Hospital\?\s+@relation\(fields:\s*\[hospitalId\],\s*references:\s*\[id\]\)/,
  'hospital             Hospital?              @relation("HospitalPatients", fields: [hospitalId], references: [id])\n  registeredFacility   Hospital?              @relation("RegisteredFacilityPatients", fields: [registeredFacilityId], references: [id])'
);
if (!s.includes('@@index([registeredFacilityId])')) {
  s = s.replace(
    /model Patient \{([\s\S]*?)\}/,
    (m) => m.replace(/\}\s*$/, '  @@index([hospitalId])\n  @@index([registeredFacilityId])\n  @@index([fullName])\n  @@index([createdAt])\n}')
  );
}

// 7. RFIDEvent:
// - rfidCardId: onDelete: Cascade
// - @@index([rfidCardId])
s = s.replace(
  /rfidCard\s+RFIDCard\?\s+@relation\(fields:\s*\[rfidCardId\],\s*references:\s*\[id\]\)/,
  'rfidCard RFIDCard? @relation(fields: [rfidCardId], references: [id], onDelete: Cascade)'
);
if (!s.includes('@@index([rfidCardId])')) {
  s = s.replace(
    /model RFIDEvent \{([\s\S]*?)\}/,
    (m) => m.replace(/\}\s*$/, '  @@index([rfidCardId])\n}')
  );
}

// 8. RFIDDevice:
// - @@index([hospitalId, status])
if (!s.includes('@@index([hospitalId, status])')) {
  s = s.replace(
    /model RFIDDevice \{([\s\S]*?)\}/,
    (m) => m.replace(/\}\s*$/, '  @@index([hospitalId, status])\n}')
  );
}

// 9. PatientSession:
// - @@index([patientId, status]), @@index([hospitalId, status]), @@index([deviceId]), @@index([departmentId])
if (!s.includes('@@index([patientId, status])')) {
  s = s.replace(
    /model PatientSession \{([\s\S]*?)\}/,
    (m) => m.replace(/\}\s*$/, '  @@index([patientId, status])\n  @@index([hospitalId, status])\n  @@index([deviceId])\n  @@index([departmentId])\n  @@index([createdAt])\n}')
  );
}

// 10. Consent:
// - onDelete: Cascade to session
s = s.replace(
  /session\s+PatientSession\s+@relation\(fields:\s*\[sessionId\],\s*references:\s*\[id\]\)/,
  'session PatientSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)'
);

// 11. ClinicalHistory:
// - onDelete: Cascade to session
// - @@index([patientId])
s = s.replace(
  /session\s+PatientSession\s+@relation\(fields:\s*\[sessionId\],\s*references:\s*\[id\]\)/,
  'session PatientSession   @relation(fields: [sessionId], references: [id], onDelete: Cascade)'
);
if (!s.includes('@@index([patientId])')) {
  s = s.replace(
    /model ClinicalHistory \{([\s\S]*?)\}/,
    (m) => m.replace(/\}\s*$/, '  @@index([patientId])\n}')
  );
}

// 12. ClinicalAnswer:
// - onDelete: Cascade to clinicalHistory
// - @@index([clinicalHistoryId])
s = s.replace(
  /clinicalHistory\s+ClinicalHistory\s+@relation\(fields:\s*\[clinicalHistoryId\],\s*references:\s*\[id\]\)/,
  'clinicalHistory ClinicalHistory @relation(fields: [clinicalHistoryId], references: [id], onDelete: Cascade)'
);
if (!s.includes('@@index([clinicalHistoryId])')) {
  s = s.replace(
    /model ClinicalAnswer \{([\s\S]*?)\}/,
    (m) => m.replace(/\}\s*$/, '  @@index([clinicalHistoryId])\n}')
  );
}

// 13. PatientVitals:
// - onDelete: Cascade to session
// - @@index([patientId])
s = s.replace(
  /model PatientVitals \{([\s\S]*?)session\s+PatientSession\s+@relation\(fields:\s*\[sessionId\],\s*references:\s*\[id\]\)([\s\S]*?)\}/,
  (m) => {
    let res = m.replace(
      /session\s+PatientSession\s+@relation\(fields:\s*\[sessionId\],\s*references:\s*\[id\]\)/,
      'session PatientSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)'
    );
    if (!res.includes('@@index([patientId])')) {
      res = res.replace(/\}\s*$/, '  @@index([patientId])\n}');
    }
    return res;
  }
);

// 14. MedicalDocument:
// - onDelete: Cascade to session
// - @@index([patientId]), @@index([sessionId])
s = s.replace(
  /model MedicalDocument \{([\s\S]*?)session\s+PatientSession\s+@relation\(fields:\s*\[sessionId\],\s*references:\s*\[id\]\)([\s\S]*?)\}/,
  (m) => {
    let res = m.replace(
      /session\s+PatientSession\s+@relation\(fields:\s*\[sessionId\],\s*references:\s*\[id\]\)/,
      'session        PatientSession         @relation(fields: [sessionId], references: [id], onDelete: Cascade)'
    );
    if (!res.includes('@@index([patientId])')) {
      res = res.replace(/\}\s*$/, '  @@index([patientId])\n  @@index([sessionId])\n}');
    }
    return res;
  }
);

// 15. ExtractedMedicalData:
// - onDelete: Cascade to document
// - @@index([documentId])
s = s.replace(
  /document\s+MedicalDocument\s+@relation\(fields:\s*\[documentId\],\s*references:\s*\[id\]\)/,
  'document MedicalDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)'
);
if (!s.includes('@@index([documentId])')) {
  s = s.replace(
    /model ExtractedMedicalData \{([\s\S]*?)\}/,
    (m) => m.replace(/\}\s*$/, '  @@index([documentId])\n}')
  );
}

// 16. OCRJob:
// - @@index([sessionId])
if (!s.includes('@@index([sessionId])')) {
  s = s.replace(
    /model OCRJob \{([\s\S]*?)\}/,
    (m) => m.replace(/\}\s*$/, '  @@index([sessionId])\n}')
  );
}

// 17. MedicalTimelineEvent:
// - onDelete: Cascade to patient
// - @@index([patientId, eventDate]), @@index([sourceDocumentId])
s = s.replace(
  /model MedicalTimelineEvent \{([\s\S]*?)patient\s+Patient\s+@relation\(fields:\s*\[patientId\],\s*references:\s*\[id\]\)([\s\S]*?)\}/,
  (m) => {
    let res = m.replace(
      /patient\s+Patient\s+@relation\(fields:\s*\[patientId\],\s*references:\s*\[id\]\)/,
      'patient        Patient          @relation(fields: [patientId], references: [id], onDelete: Cascade)'
    );
    if (!res.includes('@@index([patientId, eventDate])')) {
      res = res.replace(/\}\s*$/, '  @@index([patientId, eventDate])\n  @@index([sourceDocumentId])\n}');
    }
    return res;
  }
);

// 18. AISummary:
// - onDelete: Cascade to session
// - @@index([patientId])
s = s.replace(
  /model AISummary \{([\s\S]*?)session\s+PatientSession\s+@relation\(fields:\s*\[sessionId\],\s*references:\s*\[id\]\)([\s\S]*?)\}/,
  (m) => {
    let res = m.replace(
      /session\s+PatientSession\s+@relation\(fields:\s*\[sessionId\],\s*references:\s*\[id\]\)/,
      'session PatientSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)'
    );
    if (!res.includes('@@index([patientId])')) {
      res = res.replace(/\}\s*$/, '  @@index([patientId])\n}');
    }
    return res;
  }
);

// 19. TriageQueue:
// - onDelete: Cascade to session
// - @@index([patientId]), @@index([priority, status])
s = s.replace(
  /model TriageQueue \{([\s\S]*?)session\s+PatientSession\s+@relation\(fields:\s*\[sessionId\],\s*references:\s*\[id\]\)([\s\S]*?)\}/,
  (m) => {
    let res = m.replace(
      /session\s+PatientSession\s+@relation\(fields:\s*\[sessionId\],\s*references:\s*\[id\]\)/,
      'session    PatientSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)'
    );
    if (!res.includes('@@index([patientId])')) {
      res = res.replace(/\}\s*$/, '  @@index([patientId])\n  @@index([priority, status])\n}');
    }
    return res;
  }
);

// 20. Consultation:
// - @@index([patientId]), @@index([doctorId, status])
s = s.replace(
  /model Consultation \{([\s\S]*?)\}/,
  (m) => {
    if (!m.includes('@@index([patientId])')) {
      return m.replace(/\}\s*$/, '  @@index([patientId])\n  @@index([doctorId, status])\n}');
    }
    return m;
  }
);

// 21. DoctorNote:
// - @@index([doctorId])
s = s.replace(
  /model DoctorNote \{([\s\S]*?)\}/,
  (m) => {
    if (!m.includes('@@index([doctorId])')) {
      return m.replace(/\}\s*$/, '  @@index([doctorId])\n}');
    }
    return m;
  }
);

// 22. AIAssistance:
// - @@index([consultationId])
s = s.replace(
  /model AIAssistance \{([\s\S]*?)\}/,
  (m) => {
    if (!m.includes('@@index([consultationId])')) {
      return m.replace(/\}\s*$/, '  @@index([consultationId])\n}');
    }
    return m;
  }
);

// 23. Prescription:
// - @@index([patientId]), @@index([doctorId])
s = s.replace(
  /model Prescription \{([\s\S]*?)\}/,
  (m) => {
    if (!m.includes('@@index([patientId])')) {
      return m.replace(/\}\s*$/, '  @@index([patientId])\n  @@index([doctorId])\n}');
    }
    return m;
  }
);

// 24. PrescriptionItem:
// - @@index([prescriptionId])
s = s.replace(
  /model PrescriptionItem \{([\s\S]*?)\}/,
  (m) => {
    if (!m.includes('@@index([prescriptionId])')) {
      return m.replace(/\}\s*$/, '  @@index([prescriptionId])\n}');
    }
    return m;
  }
);

// 25. Alert:
// - onDelete: Cascade to session
// - @@index([sessionId]), @@index([patientId, acknowledged])
s = s.replace(
  /model Alert \{([\s\S]*?)session\s+PatientSession\s+@relation\(fields:\s*\[sessionId\],\s*references:\s*\[id\]\)([\s\S]*?)\}/,
  (m) => {
    let res = m.replace(
      /session\s+PatientSession\s+@relation\(fields:\s*\[sessionId\],\s*references:\s*\[id\]\)/,
      'session PatientSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)'
    );
    if (!res.includes('@@index([sessionId])')) {
      res = res.replace(/\}\s*$/, '  @@index([sessionId])\n  @@index([patientId, acknowledged])\n}');
    }
    return res;
  }
);

// 26. DiseaseOutbreakSignal:
// - @@index([hospitalId])
s = s.replace(
  /model DiseaseOutbreakSignal \{([\s\S]*?)\}/,
  (m) => {
    if (!m.includes('@@index([hospitalId])')) {
      return m.replace(/\}\s*$/, '  @@index([hospitalId])\n}');
    }
    return m;
  }
);

// 27. AbdmConsentArtefact:
// - @@index([patientId])
s = s.replace(
  /model AbdmConsentArtefact \{([\s\S]*?)\}/,
  (m) => {
    if (!m.includes('@@index([patientId])')) {
      return m.replace(/\}\s*$/, '  @@index([patientId])\n}');
    }
    return m;
  }
);

// 28. Appointment:
// - prescriptions PatientPrescription[]
// - @@index([facilityId, status]), @@index([departmentId])
if (!s.includes('prescriptions PatientPrescription[]')) {
  s = s.replace(
    /invoices\s+BillingInvoice\[\]/,
    'invoices      BillingInvoice[]\n  prescriptions PatientPrescription[]'
  );
}
s = s.replace(
  /model Appointment \{([\s\S]*?)\}/,
  (m) => {
    if (!m.includes('@@index([facilityId, status])')) {
      return m.replace(/\}\s*$/, '  @@index([facilityId, status])\n  @@index([departmentId])\n}');
    }
    return m;
  }
);

// 29. BillingInvoice:
// - @@index([appointmentId])
s = s.replace(
  /model BillingInvoice \{([\s\S]*?)\}/,
  (m) => {
    if (!m.includes('@@index([appointmentId])')) {
      return m.replace(/\}\s*$/, '  @@index([appointmentId])\n}');
    }
    return m;
  }
);

// 30. PatientPrescription:
// - appointment Appointment? @relation(fields: [appointmentId], references: [id])
// - @@index([doctorId]), @@index([appointmentId])
if (!s.includes('appointment Appointment?')) {
  s = s.replace(
    /doctor\s+Doctor\?\s+@relation\(fields:\s*\[doctorId\],\s*references:\s*\[id\]\)/,
    'doctor      Doctor?      @relation(fields: [doctorId], references: [id])\n  appointment Appointment? @relation(fields: [appointmentId], references: [id])'
  );
}
s = s.replace(
  /model PatientPrescription \{([\s\S]*?)\}/,
  (m) => {
    if (!m.includes('@@index([doctorId])')) {
      return m.replace(/\}\s*$/, '  @@index([doctorId])\n  @@index([appointmentId])\n}');
    }
    return m;
  }
);

fs.writeFileSync(schemaPath, s, 'utf8');
console.log('Successfully updated schema.prisma!');
