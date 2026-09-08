import fs from 'fs';

const schema = fs.readFileSync('apps/backend/prisma/schema.prisma', 'utf8');

// Parse models with fields, attributes, relations
function parseSchema(text) {
  const models = {};
  const enums = {};
  
  const enumRegex = /enum\s+(\w+)\s+\{([^}]+)\}/gs;
  let em;
  while ((em = enumRegex.exec(text)) !== null) {
    enums[em[1]] = em[2].trim().split(/\s+/).filter(Boolean);
  }

  const modelRegex = /model\s+(\w+)\s+\{([^}]+)\}/gs;
  let mm;
  while ((mm = modelRegex.exec(text)) !== null) {
    const name = mm[1];
    const body = mm[2];
    const fields = {};
    const indexes = [];
    const uniques = [];

    const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
    for (const l of lines) {
      if (l.startsWith('//')) continue;
      if (l.startsWith('@@index')) {
        indexes.push(l);
        continue;
      }
      if (l.startsWith('@@unique')) {
        uniques.push(l);
        continue;
      }
      const parts = l.split(/\s+/);
      if (parts.length >= 2) {
        const fieldName = parts[0];
        const fieldType = parts[1];
        fields[fieldName] = {
          type: fieldType,
          raw: l,
          isRelation: false,
          relationDetails: null
        };
      }
    }
    models[name] = { fields, indexes, uniques };
  }

  // Detect relation fields
  for (const [mName, mData] of Object.entries(models)) {
    for (const [fName, fData] of Object.entries(mData.fields)) {
      const clean = fData.type.replace('[]', '').replace('?', '');
      if (models[clean]) {
        fData.isRelation = true;
        fData.targetModel = clean;
        const relMatch = fData.raw.match(/@relation\((.*)\)/);
        if (relMatch) {
          fData.relationDetails = relMatch[1];
        }
      }
    }
  }

  return { models, enums };
}

const { models, enums } = parseSchema(schema);

console.log('=== Checking Target Hierarchy ===');

// Check NationalAuthority -> State
console.log('NationalAuthority fields:', Object.keys(models.NationalAuthority.fields));
console.log('State fields:', Object.keys(models.State.fields));
console.log('District fields:', Object.keys(models.District.fields));
console.log('Hospital fields:', Object.keys(models.Hospital.fields));
console.log('Department fields:', Object.keys(models.Department.fields));
console.log('Doctor fields:', Object.keys(models.Doctor.fields));
console.log('Patient fields:', Object.keys(models.Patient.fields));
console.log('Appointment fields:', Object.keys(models.Appointment.fields));
console.log('BillingInvoice fields:', Object.keys(models.BillingInvoice.fields));
console.log('PatientNotification fields:', Object.keys(models.PatientNotification.fields));
console.log('PatientPrescription fields:', Object.keys(models.PatientPrescription.fields));
console.log('Prescription fields:', Object.keys(models.Prescription.fields));
console.log('Consultation fields:', Object.keys(models.Consultation.fields));
console.log('PatientSession fields:', Object.keys(models.PatientSession.fields));
console.log('MedicalTimelineEvent fields:', Object.keys(models.MedicalTimelineEvent.fields));
console.log('DiseaseOutbreakSignal fields:', Object.keys(models.DiseaseOutbreakSignal.fields));
console.log('AbdmConsentArtefact fields:', Object.keys(models.AbdmConsentArtefact.fields));
console.log('FHIRResourceMapping fields:', Object.keys(models.FHIRResourceMapping.fields));

