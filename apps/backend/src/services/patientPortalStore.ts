import bcrypt from 'bcryptjs';
import type {
  AppointmentEntity,
  AppointmentStatus,
  AppointmentType,
  BillingInvoiceEntity,
  BillingStatus,
  LabReportEntity,
  PatientNotificationEntity,
  PatientPortalProfile,
  PaymentMethod,
  PrescriptionEntity,
} from '@medikiosk/shared-types';
import { prisma } from '../lib/prisma.js';

export interface InMemoryPatient {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  passwordHash: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
  bloodGroup: string | null;
  address: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  abhaId: string | null;
  registeredFacilityId: string | null;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// In-Memory Seed State (Reflects seed.ts exactly)
// ---------------------------------------------------------------------------

const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('MediKiosk@123', 8);

const PATIENTS_MAP = new Map<string, InMemoryPatient>([
  [
    'demo-patient-001',
    {
      id: 'demo-patient-001',
      fullName: 'Aarav Sharma',
      phone: '9999900001',
      email: 'aarav.sharma@medikiosk.local',
      passwordHash: DEFAULT_PASSWORD_HASH,
      dateOfBirth: new Date('1985-03-14'),
      gender: 'Male',
      bloodGroup: 'B+',
      address: 'B-24, AIIMS Residential Complex, Ansari Nagar, New Delhi',
      emergencyContact: 'Sunita Sharma (Spouse)',
      emergencyPhone: '+91 98765 43210',
      abhaId: '91-4820-9102-3819',
      registeredFacilityId: 'HOSP-DEL-AIIMS',
      createdAt: new Date('2026-01-15T09:00:00.000Z'),
    },
  ],
  [
    'demo-patient-002',
    {
      id: 'demo-patient-002',
      fullName: 'Priya Verma',
      phone: '9999900002',
      email: 'priya.verma@medikiosk.local',
      passwordHash: DEFAULT_PASSWORD_HASH,
      dateOfBirth: new Date('1992-07-22'),
      gender: 'Female',
      bloodGroup: 'O+',
      address: 'Flat 402, Green View Apartments, Rohini Sector 9, New Delhi',
      emergencyContact: 'Vikram Verma (Brother)',
      emergencyPhone: '+91 98765 11223',
      abhaId: '91-1029-4829-5710',
      registeredFacilityId: 'HOSP-DEL-AIIMS',
      createdAt: new Date('2026-02-01T10:00:00.000Z'),
    },
  ],
  [
    'demo-patient-003',
    {
      id: 'demo-patient-003',
      fullName: 'Ramesh Patel',
      phone: '9999900003',
      email: 'ramesh.patel@medikiosk.local',
      passwordHash: DEFAULT_PASSWORD_HASH,
      dateOfBirth: new Date('1968-11-05'),
      gender: 'Male',
      bloodGroup: 'AB+',
      address: 'House 12, Block C, Vasant Kunj, New Delhi',
      emergencyContact: 'Anita Patel (Daughter)',
      emergencyPhone: '+91 98765 33445',
      abhaId: '91-8821-3910-1120',
      registeredFacilityId: 'HOSP-DEL-AIIMS',
      createdAt: new Date('2026-01-20T11:00:00.000Z'),
    },
  ],
]);

const tomorrowDate = new Date();
tomorrowDate.setDate(tomorrowDate.getDate() + 1);
tomorrowDate.setHours(10, 0, 0, 0);

const pastDate14 = new Date();
pastDate14.setDate(pastDate14.getDate() - 14);
pastDate14.setHours(11, 30, 0, 0);

const APPOINTMENTS_MAP = new Map<string, AppointmentEntity>([
  [
    'appt-demo-aarav-01',
    {
      id: 'appt-demo-aarav-01',
      patientId: 'demo-patient-001',
      doctorId: 'DOC-01',
      doctorName: 'Dr. Rohan Mehta',
      doctorDepartment: 'Cardiology OPD',
      facilityId: 'HOSP-DEL-AIIMS',
      facilityName: 'AIIMS New Delhi Central Hospital',
      departmentId: 'dept-cardio',
      departmentName: 'Cardiology OPD',
      appointmentDate: tomorrowDate.toISOString(),
      timeSlot: '10:00 AM',
      type: 'FOLLOW_UP',
      status: 'CONFIRMED',
      reason: 'Cardiology Follow-up & ECG Review',
      notes: 'Routine 2-week reassessment following cardiac triage at kiosk.',
      location: 'Cardiology OPD (Wing B, 2nd Floor)',
      createdAt: new Date('2026-09-01T08:00:00.000Z').toISOString(),
      updatedAt: new Date('2026-09-01T08:00:00.000Z').toISOString(),
    },
  ],
  [
    'appt-demo-aarav-02',
    {
      id: 'appt-demo-aarav-02',
      patientId: 'demo-patient-001',
      doctorId: 'DOC-01',
      doctorName: 'Dr. Rohan Mehta',
      doctorDepartment: 'Cardiology OPD',
      facilityId: 'HOSP-DEL-AIIMS',
      facilityName: 'AIIMS New Delhi Central Hospital',
      departmentId: 'dept-cardio',
      departmentName: 'Cardiology OPD',
      appointmentDate: pastDate14.toISOString(),
      timeSlot: '11:30 AM',
      type: 'IN_PERSON',
      status: 'COMPLETED',
      reason: 'Initial Consultation: Acute Chest Heaviness',
      notes: 'Triage conducted; advised echocardiography and lipid profile test.',
      location: 'Cardiology OPD (Wing B, 2nd Floor)',
      createdAt: pastDate14.toISOString(),
      updatedAt: pastDate14.toISOString(),
    },
  ],
  [
    'appt-demo-priya-01',
    {
      id: 'appt-demo-priya-01',
      patientId: 'demo-patient-002',
      doctorId: 'DOC-02',
      doctorName: 'Dr. Kavita Nair',
      doctorDepartment: 'Pediatrics / Pulmonology OPD',
      facilityId: 'HOSP-DEL-AIIMS',
      facilityName: 'AIIMS New Delhi Central Hospital',
      departmentId: 'dept-peds',
      departmentName: 'Pediatrics OPD',
      appointmentDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      timeSlot: '02:30 PM',
      type: 'FOLLOW_UP',
      status: 'CONFIRMED',
      reason: 'Asthma Symptom Review & Spirometry Follow-up',
      notes: 'Monitoring response to bronchodilator therapy.',
      location: 'Pediatrics & Respiratory OPD (Block C, 1st Floor)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
]);

const PRESCRIPTIONS_MAP = new Map<string, PrescriptionEntity>([
  [
    'rx-demo-aarav-01',
    {
      id: 'rx-demo-aarav-01',
      patientId: 'demo-patient-001',
      doctorId: 'DOC-01',
      doctorName: 'Dr. Rohan Mehta',
      appointmentId: 'appt-demo-aarav-01',
      prescriptionDate: new Date(Date.now() - 2 * 86400000).toISOString(),
      diagnosis: 'Stable Angina / Essential Hypertension',
      instructions: 'Take medications strictly after meals with plenty of water. Avoid high-sodium diet.',
      medications: [
        {
          name: 'Tab. Atorvastatin',
          dosage: '20 mg',
          frequency: 'Once daily at bedtime (OD)',
          duration: '30 days',
          instructions: 'After dinner with water',
          route: 'Oral',
          startDate: new Date(Date.now() - 2 * 86400000).toISOString(),
          endDate: new Date(Date.now() + 28 * 86400000).toISOString(),
        },
        {
          name: 'Tab. Ramipril',
          dosage: '2.5 mg',
          frequency: 'Once daily morning (OD)',
          duration: '30 days',
          instructions: 'Before breakfast',
          route: 'Oral',
          startDate: new Date(Date.now() - 2 * 86400000).toISOString(),
          endDate: new Date(Date.now() + 28 * 86400000).toISOString(),
        },
        {
          name: 'Tab. Ecosprin (Aspirin)',
          dosage: '75 mg',
          frequency: 'Once daily post lunch (OD)',
          duration: '30 days',
          instructions: 'After lunch',
          route: 'Oral',
          startDate: new Date(Date.now() - 2 * 86400000).toISOString(),
          endDate: new Date(Date.now() + 28 * 86400000).toISOString(),
        },
        {
          name: 'Tab. Sorbitrate (SOS)',
          dosage: '5 mg',
          frequency: 'Sublingual if chest tightness occurs',
          duration: 'As needed',
          instructions: 'Place under tongue',
          route: 'Sublingual',
          startDate: new Date(Date.now() - 2 * 86400000).toISOString(),
          endDate: new Date(Date.now() + 28 * 86400000).toISOString(),
        },
      ],
      pdfUrl: '/api/patient/prescriptions/rx-demo-aarav-01/download',
      status: 'Active',
      startDate: new Date(Date.now() - 2 * 86400000).toISOString(),
      endDate: new Date(Date.now() + 28 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ],
  [
    'rx-demo-aarav-02',
    {
      id: 'rx-demo-aarav-02',
      patientId: 'demo-patient-001',
      doctorId: 'DOC-01',
      doctorName: 'Dr. Rohan Mehta',
      appointmentId: 'appt-demo-aarav-02',
      prescriptionDate: new Date(Date.now() - 45 * 86400000).toISOString(),
      diagnosis: 'Acute Upper Respiratory Tract Episode',
      instructions: 'Completed course. Keep chest warm.',
      medications: [
        {
          name: 'Tab. Amoxicillin + Clavulanic Acid',
          dosage: '625 mg',
          frequency: 'Twice daily (BD)',
          duration: '5 days',
          instructions: 'After meals',
          route: 'Oral',
          startDate: new Date(Date.now() - 45 * 86400000).toISOString(),
          endDate: new Date(Date.now() - 40 * 86400000).toISOString(),
        },
        {
          name: 'Tab. Paracetamol',
          dosage: '650 mg',
          frequency: 'Thrice daily (TDS)',
          duration: '3 days',
          instructions: 'For fever/discomfort',
          route: 'Oral',
          startDate: new Date(Date.now() - 45 * 86400000).toISOString(),
          endDate: new Date(Date.now() - 42 * 86400000).toISOString(),
        },
      ],
      pdfUrl: '/api/patient/prescriptions/rx-demo-aarav-02/download',
      status: 'Expired',
      startDate: new Date(Date.now() - 45 * 86400000).toISOString(),
      endDate: new Date(Date.now() - 40 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    },
  ],
  [
    'rx-demo-priya-01',
    {
      id: 'rx-demo-priya-01',
      patientId: 'demo-patient-002',
      doctorId: 'DOC-02',
      doctorName: 'Dr. Kavita Nair',
      appointmentId: 'appt-demo-priya-01',
      prescriptionDate: new Date().toISOString(),
      diagnosis: 'Bronchial Asthma & Allergic Rhinitis',
      instructions: 'Rinse mouth after inhalation. Avoid dust exposure.',
      medications: [
        {
          name: 'Inhaler Budesonide + Formoterol',
          dosage: '200 mcg',
          frequency: '2 puffs twice daily',
          duration: '60 days',
          instructions: 'Inhale with spacer',
          route: 'Inhalation',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 60 * 86400000).toISOString(),
        },
      ],
      pdfUrl: '/api/patient/prescriptions/rx-demo-priya-01/download',
      status: 'Active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 60 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
    },
  ],
]);

const REPORTS_MAP = new Map<string, LabReportEntity>([
  [
    'lab-report-cbc-01',
    {
      id: 'lab-report-cbc-01',
      patientId: 'demo-patient-001',
      title: 'Complete Blood Count (CBC) Panel',
      testDate: new Date(Date.now() - 3 * 86400000).toISOString(),
      category: 'Hematology',
      facilityName: 'AIIMS Diagnostic Central Lab',
      doctorName: 'Dr. Suresh Sen (Pathologist)',
      departmentName: 'Department of Hematology',
      status: 'COMPLETED',
      originalFilename: 'CBC_Report_AIIMS.pdf',
      parameters: [
        { name: 'Hemoglobin (Hb)', value: '13.8', unit: 'g/dL', referenceRange: '13.0 - 17.0', status: 'NORMAL' },
        { name: 'Total Leukocyte Count (TLC)', value: '8,200', unit: '/cumm', referenceRange: '4,000 - 11,000', status: 'NORMAL' },
        { name: 'Packed Cell Volume (PCV)', value: '42.1', unit: '%', referenceRange: '40.0 - 50.0', status: 'NORMAL' },
        { name: 'Platelet Count', value: '265,000', unit: '/cumm', referenceRange: '150,000 - 450,000', status: 'NORMAL' },
        { name: 'Neutrophils', value: '62', unit: '%', referenceRange: '40 - 75', status: 'NORMAL' },
      ],
      doctorNotes: 'Hematological parameters normal. No signs of acute inflammation or anemia.',
      fileUrl: '/api/patient/reports/lab-report-cbc-01/download',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
  ],
  [
    'lab-report-lipid-02',
    {
      id: 'lab-report-lipid-02',
      patientId: 'demo-patient-001',
      title: 'Comprehensive Lipid & Metabolic Profile',
      testDate: new Date(Date.now() - 14 * 86400000).toISOString(),
      category: 'Biochemistry',
      facilityName: 'AIIMS Clinical Biochemistry Dept',
      doctorName: 'Dr. Meenakshi Sundaram',
      departmentName: 'Department of Clinical Biochemistry',
      status: 'COMPLETED',
      originalFilename: 'Lipid_Panel_Screen.pdf',
      parameters: [
        { name: 'Total Serum Cholesterol', value: '185', unit: 'mg/dL', referenceRange: '< 200', status: 'NORMAL' },
        { name: 'HDL Cholesterol (Good)', value: '52', unit: 'mg/dL', referenceRange: '> 40', status: 'NORMAL' },
        { name: 'LDL Cholesterol (Direct)', value: '108', unit: 'mg/dL', referenceRange: '< 100', status: 'ABNORMAL' },
        { name: 'Triglycerides', value: '142', unit: 'mg/dL', referenceRange: '< 150', status: 'NORMAL' },
        { name: 'Fasting Blood Glucose', value: '96', unit: 'mg/dL', referenceRange: '70 - 100', status: 'NORMAL' },
      ],
      doctorNotes: 'Borderline LDL cholesterol. Dietary modification and regular aerobic exercise advised. Recheck after 3 months.',
      fileUrl: '/api/patient/reports/lab-report-lipid-02/download',
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    },
  ],
  [
    'lab-report-priya-01',
    {
      id: 'lab-report-priya-01',
      patientId: 'demo-patient-002',
      title: 'Pulmonary Function & Spirometry Test (PFT)',
      testDate: new Date(Date.now() - 5 * 86400000).toISOString(),
      category: 'Pulmonology',
      facilityName: 'AIIMS Respiratory Diagnostics Wing',
      doctorName: 'Dr. Kavita Nair (Pulmonologist)',
      departmentName: 'Department of Pulmonary Medicine',
      status: 'COMPLETED',
      originalFilename: 'PFT_Spirometry_Priya.pdf',
      parameters: [
        { name: 'FEV1 (Forced Expiratory Volume)', value: '2.85', unit: 'L', referenceRange: '> 2.50', status: 'NORMAL' },
        { name: 'FVC (Forced Vital Capacity)', value: '3.40', unit: 'L', referenceRange: '> 3.00', status: 'NORMAL' },
        { name: 'FEV1/FVC Ratio', value: '83.8', unit: '%', referenceRange: '75 - 85', status: 'NORMAL' },
        { name: 'Peak Expiratory Flow (PEF)', value: '410', unit: 'L/min', referenceRange: '380 - 500', status: 'NORMAL' },
      ],
      doctorNotes: 'Mild reversible airway limitation noted pre-bronchodilator; improved by 14% post-salbutamol.',
      fileUrl: '/api/patient/reports/lab-report-priya-01/download',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ],
]);

const INVOICES_MAP = new Map<string, BillingInvoiceEntity>([
  [
    'inv-aarav-001',
    {
      id: 'inv-aarav-001',
      patientId: 'demo-patient-001',
      invoiceNumber: 'INV-2026-0001',
      description: 'OPD Super-Specialist Consultation Fee (Cardiology)',
      department: 'Cardiology OPD',
      totalAmount: 300.0,
      discountAmount: 50.0,
      netAmount: 250.0,
      status: 'PAID',
      paymentMethod: 'UPI',
      paymentDate: new Date(Date.now() - 14 * 86400000).toISOString(),
      transactionReference: 'UPI/20260901/78394129',
      items: [
        { description: 'Senior Consultant Review Fee', quantity: 1, unitPrice: 250.0, amount: 250.0 },
        { description: 'Digital ECG Recording & Interpretation', quantity: 1, unitPrice: 50.0, amount: 50.0 },
      ],
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    },
  ],
  [
    'inv-aarav-002',
    {
      id: 'inv-aarav-002',
      patientId: 'demo-patient-001',
      appointmentId: 'appt-demo-aarav-01',
      invoiceNumber: 'INV-2026-0002',
      description: 'Follow-up Cardiology OPD & Diagnostic Panels',
      department: 'Cardiology Diagnostics',
      totalAmount: 550.0,
      discountAmount: 0.0,
      netAmount: 550.0,
      status: 'PENDING',
      paymentMethod: null,
      paymentDate: null,
      transactionReference: null,
      items: [
        { description: 'OPD Follow-up Evaluation Fee', quantity: 1, unitPrice: 250.0, amount: 250.0 },
        { description: 'Automated Biochemical Lipid Panel Screen', quantity: 1, unitPrice: 300.0, amount: 300.0 },
      ],
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ],
  [
    'inv-priya-001',
    {
      id: 'inv-priya-001',
      patientId: 'demo-patient-002',
      appointmentId: 'appt-demo-priya-01',
      invoiceNumber: 'INV-2026-0003',
      description: 'Pulmonology Consultation & Spirometry Test',
      department: 'Pulmonology OPD',
      totalAmount: 400.0,
      discountAmount: 50.0,
      netAmount: 350.0,
      status: 'PENDING',
      paymentMethod: null,
      paymentDate: null,
      transactionReference: null,
      items: [
        { description: 'Respiratory Specialist Consultation', quantity: 1, unitPrice: 200.0, amount: 200.0 },
        { description: 'Pre and Post Bronchodilator Spirometry', quantity: 1, unitPrice: 150.0, amount: 150.0 },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
]);

const NOTIFICATIONS_MAP = new Map<string, PatientNotificationEntity>([
  [
    'notif-aarav-01',
    {
      id: 'notif-aarav-01',
      patientId: 'demo-patient-001',
      title: 'Appointment Scheduled & Confirmed',
      message: 'Your Cardiology Follow-up with Dr. Rohan Mehta is confirmed for 10:00 AM tomorrow at Wing B, Room 204.',
      type: 'APPOINTMENT_CONFIRMED',
      read: false,
      actionUrl: '/appointments',
      createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    },
  ],
  [
    'notif-aarav-02',
    {
      id: 'notif-aarav-02',
      patientId: 'demo-patient-001',
      title: 'Complete Blood Count (CBC) Panel Released',
      message: 'Your diagnostic laboratory report has been verified by the pathology department and is ready to view.',
      type: 'HEALTH_ALERT',
      read: true,
      actionUrl: '/reports',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
  ],
  [
    'notif-priya-01',
    {
      id: 'notif-priya-01',
      patientId: 'demo-patient-002',
      title: 'Pulmonology Follow-up Scheduled',
      message: 'Your consultation with Dr. Kavita Nair is confirmed for 02:30 PM in 3 days.',
      type: 'APPOINTMENT_CONFIRMED',
      read: false,
      actionUrl: '/appointments',
      createdAt: new Date().toISOString(),
    },
  ],
]);

// ---------------------------------------------------------------------------
// Store Service Functions with Automatic DB Query -> In-Memory Fallback
// ---------------------------------------------------------------------------

export async function storeFindPatientById(id: string): Promise<InMemoryPatient | null> {
  try {
    const patient = await prisma.patient.findUnique({ where: { id } });
    if (patient) return patient as InMemoryPatient;
  } catch {
    // Database offline fallback
  }
  return PATIENTS_MAP.get(id) ?? null;
}

export async function storeFindPatientByIdentifier(identifier: string): Promise<InMemoryPatient | null> {
  const digits = identifier.replace(/\D/g, '');
  const cleanPhone = digits.length >= 10 ? digits.slice(-10) : '';

  try {
    const orConditions: any[] = [
      { email: identifier },
      { phone: identifier },
      { id: identifier },
    ];
    if (cleanPhone) {
      orConditions.push({ phone: cleanPhone });
      orConditions.push({ phone: `+91${cleanPhone}` });
      orConditions.push({ phone: `+91 ${cleanPhone}` });
      orConditions.push({ phone: `91${cleanPhone}` });
    }
    const patient = await prisma.patient.findFirst({
      where: {
        OR: orConditions,
      },
    });
    if (patient) return patient as InMemoryPatient;
  } catch {
    // Database offline fallback
  }

  for (const p of PATIENTS_MAP.values()) {
    if (
      p.id === identifier ||
      p.phone === identifier ||
      p.email === identifier ||
      (cleanPhone && p.phone && p.phone.replace(/\D/g, '').endsWith(cleanPhone))
    ) {
      return p;
    }
  }
  return null;
}

export async function storeCreatePatient(data: {
  fullName: string;
  phone: string;
  email?: string | null;
  passwordHash?: string | null;
  dateOfBirth?: Date | null;
  gender?: string | null;
  bloodGroup?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  abhaId?: string | null;
}): Promise<InMemoryPatient> {
  const finalPasswordHash = data.passwordHash || (await bcrypt.hash('MediKiosk@123', 10));
  try {
    const created = await prisma.patient.create({
      data: {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email ?? null,
        passwordHash: finalPasswordHash,
        dateOfBirth: data.dateOfBirth ?? null,
        gender: data.gender ?? null,
        bloodGroup: data.bloodGroup ?? null,
        address: data.address ?? null,
        emergencyContact: data.emergencyContact ?? null,
        emergencyPhone: data.emergencyPhone ?? null,
        abhaId: data.abhaId ?? `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        registrationSource: 'MANUAL',
      },
    });
    if (created) return created as InMemoryPatient;
  } catch {
    // Database offline fallback
  }

  const id = `patient-${Date.now()}`;
  const newPatient: InMemoryPatient = {
    id,
    fullName: data.fullName,
    phone: data.phone,
    email: data.email ?? null,
    passwordHash: finalPasswordHash,
    dateOfBirth: data.dateOfBirth ?? null,
    gender: data.gender ?? null,
    bloodGroup: data.bloodGroup ?? null,
    address: data.address ?? null,
    emergencyContact: data.emergencyContact ?? null,
    emergencyPhone: data.emergencyPhone ?? null,
    abhaId: data.abhaId ?? `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
    registeredFacilityId: 'HOSP-DEL-AIIMS',
    createdAt: new Date(),
  };
  PATIENTS_MAP.set(id, newPatient);
  return newPatient;
}

export async function storeUpdatePatient(
  id: string,
  data: Partial<InMemoryPatient>,
): Promise<InMemoryPatient | null> {
  try {
    const updated = await prisma.patient.update({
      where: { id },
      data: {
        phone: data.phone ?? undefined,
        email: data.email ?? undefined,
        address: data.address ?? undefined,
        bloodGroup: data.bloodGroup ?? undefined,
        emergencyContact: data.emergencyContact ?? undefined,
        emergencyPhone: data.emergencyPhone ?? undefined,
      },
    });
    if (updated) return updated as InMemoryPatient;
  } catch {
    // Database offline fallback
  }

  const existing = PATIENTS_MAP.get(id);
  if (!existing) return null;

  const merged = { ...existing, ...data };
  PATIENTS_MAP.set(id, merged);
  return merged;
}

export async function storeFindAppointments(patientId: string, status?: string): Promise<AppointmentEntity[]> {
  try {
    const where: any = { patientId };
    if (status) where.status = status;
    const dbAppts = await prisma.appointment.findMany({
      where,
      include: { doctor: true, facility: true, department: true },
      orderBy: { appointmentDate: 'desc' },
    });
    return dbAppts.map((a) => ({
      id: a.id,
      patientId: a.patientId,
      doctorId: a.doctorId,
      doctorName: a.doctor?.name ?? null,
      doctorDepartment: a.doctor?.department ?? null,
      facilityId: a.facilityId,
      facilityName: a.facility?.name ?? null,
      departmentId: a.departmentId,
      departmentName: a.department?.name ?? null,
      appointmentDate: a.appointmentDate.toISOString(),
      timeSlot: a.timeSlot,
      type: a.type,
      status: a.status,
      reason: a.reason,
      notes: a.notes,
      cancellationReason: a.cancellationReason,
      location: a.department?.floor ? `${a.department.name} (${a.department.floor})` : 'AIIMS Main OPD Block',
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));
  } catch {
    // Database offline fallback
  }

  if (patientId === 'demo-patient-001') {
    const result: AppointmentEntity[] = [];
    for (const a of APPOINTMENTS_MAP.values()) {
      if (a.patientId === patientId) {
        if (!status || a.status === status) {
          result.push(a);
        }
      }
    }
    return result.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
  }
  return [];
}

export async function storeCreateAppointment(data: {
  patientId: string;
  doctorId?: string | null;
  doctorName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  appointmentDate: Date;
  timeSlot: string;
  type: AppointmentType;
  reason: string;
  notes?: string | null;
}): Promise<AppointmentEntity> {
  try {
    const created = await prisma.appointment.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId ?? null,
        departmentId: data.departmentId ?? null,
        appointmentDate: data.appointmentDate,
        timeSlot: data.timeSlot,
        type: data.type,
        status: 'CONFIRMED',
        reason: data.reason,
        notes: data.notes ?? null,
      },
      include: { doctor: true, facility: true, department: true },
    });
    if (created) {
      // Auto-create Billing Invoice in DB
      try {
        const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
        await prisma.billingInvoice.create({
          data: {
            patientId: data.patientId,
            appointmentId: created.id,
            invoiceNumber,
            description: `OPD Consultation Fee - ${created.department?.name ?? 'General Clinic'}`,
            department: created.department?.name ?? 'General OPD',
            totalAmount: 250.0,
            discountAmount: 0.0,
            netAmount: 250.0,
            status: 'PENDING',
            items: [
              { description: 'OPD Specialist Consultation', quantity: 1, unitPrice: 250.0, amount: 250.0 },
            ],
          },
        });
      } catch (invErr) {
        console.warn('[Billing] Could not persist invoice:', invErr);
      }

      // Auto-create Notification in DB
      try {
        await prisma.patientNotification.create({
          data: {
            patientId: data.patientId,
            title: 'Appointment Confirmed',
            message: `Your appointment with ${created.doctor?.name ?? 'Doctor'} for ${data.timeSlot} on ${data.appointmentDate.toISOString().split('T')[0]} has been confirmed.`,
            type: 'APPOINTMENT_CONFIRMED',
            actionUrl: '/appointments',
          },
        });
      } catch (notifErr) {
        console.warn('[Notification] Could not persist notification:', notifErr);
      }

      return {
        id: created.id,
        patientId: created.patientId,
        doctorId: created.doctorId,
        doctorName: created.doctor?.name ?? null,
        doctorDepartment: created.doctor?.department ?? null,
        facilityId: created.facilityId,
        facilityName: created.facility?.name ?? null,
        departmentId: created.departmentId,
        departmentName: created.department?.name ?? null,
        appointmentDate: created.appointmentDate.toISOString(),
        timeSlot: created.timeSlot,
        type: created.type,
        status: created.status,
        reason: created.reason,
        notes: created.notes,
        cancellationReason: created.cancellationReason,
        location: created.department?.floor ? `${created.department.name} (${created.department.floor})` : 'AIIMS Main OPD Block',
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    }
  } catch {
    // Database offline fallback
  }

  const id = `appt-${Date.now()}`;
  const appt: AppointmentEntity = {
    id,
    patientId: data.patientId,
    doctorId: data.doctorId ?? 'DOC-01',
    doctorName: data.doctorName ?? 'Dr. Rohan Mehta',
    doctorDepartment: data.departmentName ?? 'General Medicine OPD',
    facilityId: 'HOSP-DEL-AIIMS',
    facilityName: 'AIIMS New Delhi Central Hospital',
    departmentId: data.departmentId ?? 'dept-gen',
    departmentName: data.departmentName ?? 'General Medicine OPD',
    appointmentDate: data.appointmentDate.toISOString(),
    timeSlot: data.timeSlot,
    type: data.type,
    status: 'CONFIRMED',
    reason: data.reason,
    notes: data.notes ?? null,
    location: 'AIIMS Main OPD Block, Room 204',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  APPOINTMENTS_MAP.set(id, appt);

  // Auto-generate invoice
  const invId = `inv-${Date.now().toString().slice(-6)}`;
  INVOICES_MAP.set(invId, {
    id: invId,
    patientId: data.patientId,
    appointmentId: id,
    invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    description: `OPD Consultation Fee - ${appt.departmentName ?? 'General Clinic'}`,
    department: appt.departmentName ?? 'General OPD',
    totalAmount: 250.0,
    discountAmount: 0.0,
    netAmount: 250.0,
    status: 'PENDING',
    paymentMethod: null,
    paymentDate: null,
    transactionReference: null,
    items: [{ description: 'OPD Specialist Consultation Fee', quantity: 1, unitPrice: 250.0, amount: 250.0 }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return appt;
}

export async function storeRescheduleAppointment(
  id: string,
  patientId: string,
  newDate: Date,
  newSlot: string,
  reason?: string,
): Promise<AppointmentEntity | null> {
  try {
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        appointmentDate: newDate,
        timeSlot: newSlot,
        status: 'RESCHEDULED',
        notes: reason ? `Rescheduled: ${reason}` : undefined,
      },
      include: { doctor: true, facility: true, department: true },
    });
    if (updated) {
      return {
        id: updated.id,
        patientId: updated.patientId,
        doctorId: updated.doctorId,
        doctorName: updated.doctor?.name ?? null,
        doctorDepartment: updated.doctor?.department ?? null,
        facilityId: updated.facilityId,
        facilityName: updated.facility?.name ?? null,
        departmentId: updated.departmentId,
        departmentName: updated.department?.name ?? null,
        appointmentDate: updated.appointmentDate.toISOString(),
        timeSlot: updated.timeSlot,
        type: updated.type,
        status: updated.status,
        reason: updated.reason,
        notes: updated.notes,
        cancellationReason: updated.cancellationReason,
        location: 'AIIMS Main OPD Block, Room 204',
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    }
  } catch {
    // Database offline fallback
  }

  const existing = APPOINTMENTS_MAP.get(id);
  if (!existing || existing.patientId !== patientId) return null;

  existing.appointmentDate = newDate.toISOString();
  existing.timeSlot = newSlot;
  existing.status = 'RESCHEDULED';
  if (reason) existing.notes = `Rescheduled: ${reason}`;
  existing.updatedAt = new Date().toISOString();
  APPOINTMENTS_MAP.set(id, existing);
  return existing;
}

export async function storeCancelAppointment(
  id: string,
  patientId: string,
  reason: string,
): Promise<AppointmentEntity | null> {
  try {
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancellationReason: reason,
      },
      include: { doctor: true, facility: true, department: true },
    });
    if (updated) {
      return {
        id: updated.id,
        patientId: updated.patientId,
        doctorId: updated.doctorId,
        doctorName: updated.doctor?.name ?? null,
        doctorDepartment: updated.doctor?.department ?? null,
        facilityId: updated.facilityId,
        facilityName: updated.facility?.name ?? null,
        departmentId: updated.departmentId,
        departmentName: updated.department?.name ?? null,
        appointmentDate: updated.appointmentDate.toISOString(),
        timeSlot: updated.timeSlot,
        type: updated.type,
        status: updated.status,
        reason: updated.reason,
        notes: updated.notes,
        cancellationReason: updated.cancellationReason,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    }
  } catch {
    // Database offline fallback
  }

  const existing = APPOINTMENTS_MAP.get(id);
  if (!existing || existing.patientId !== patientId) return null;

  existing.status = 'CANCELLED';
  existing.cancellationReason = reason;
  existing.updatedAt = new Date().toISOString();
  APPOINTMENTS_MAP.set(id, existing);
  return existing;
}

export async function storeFindPrescriptions(patientId: string, status?: string): Promise<PrescriptionEntity[]> {
  const list: PrescriptionEntity[] = [];

  try {
    const dbRx = await prisma.patientPrescription.findMany({
      where: { patientId },
      include: { doctor: true },
      orderBy: { prescriptionDate: 'desc' },
    });
    const now = new Date();
    if (dbRx && dbRx.length > 0) {
      for (const p of dbRx) {
        const rxDate = new Date(p.prescriptionDate);
        const diffDays = (now.getTime() - rxDate.getTime()) / (1000 * 3600 * 24);
        const compStatus = diffDays > 30 ? 'Expired' : diffDays > 14 ? 'Completed' : 'Active';
        list.push({
          id: p.id,
          patientId: p.patientId,
          doctorId: p.doctorId,
          doctorName: p.doctor?.name ?? null,
          appointmentId: p.appointmentId,
          prescriptionDate: p.prescriptionDate.toISOString(),
          diagnosis: p.diagnosis,
          instructions: p.instructions,
          medications: Array.isArray(p.medications) ? (p.medications as any) : [],
          pdfUrl: p.pdfUrl ?? `/api/patient/prescriptions/${p.id}/download`,
          status: compStatus,
          startDate: p.prescriptionDate.toISOString(),
          endDate: new Date(rxDate.getTime() + 14 * 86400000).toISOString(),
          createdAt: p.createdAt.toISOString(),
        });
      }
    }

    const clinicalRx = await prisma.prescription.findMany({
      where: { patientId },
      include: { doctor: true, items: true },
      orderBy: { createdAt: 'desc' },
    });
    if (clinicalRx && clinicalRx.length > 0) {
      for (const rx of clinicalRx) {
        if (list.some((item) => item.id === rx.id)) continue;
        const rxDate = new Date(rx.createdAt);
        const diffDays = (now.getTime() - rxDate.getTime()) / (1000 * 3600 * 24);
        const compStatus = rx.dispensed ? 'Completed' : diffDays > 30 ? 'Expired' : 'Active';
        list.push({
          id: rx.id,
          patientId: rx.patientId,
          doctorId: rx.doctorId,
          doctorName: rx.doctor?.name ?? null,
          appointmentId: null,
          prescriptionDate: rx.createdAt.toISOString(),
          diagnosis: rx.diagnosis,
          instructions: rx.clinicalNotes ?? (rx.followUpDays ? `Follow up in ${rx.followUpDays} days` : 'Take as directed'),
          medications: rx.items.map((item) => ({
            name: item.medicineName,
            dosage: item.dosage || 'Standard',
            frequency: String(item.frequency),
            duration: `${item.durationDays} days`,
            instructions: item.instructions ?? '',
            route: item.timing ?? 'Oral',
          })),
          pdfUrl: `/api/patient/prescriptions/${rx.id}/download`,
          status: compStatus,
          startDate: rx.createdAt.toISOString(),
          endDate: new Date(rxDate.getTime() + (rx.followUpDays || 7) * 86400000).toISOString(),
          createdAt: rx.createdAt.toISOString(),
        });
      }
    }

    return status
      ? list.filter((p) => p.status.toLowerCase() === status.toLowerCase())
      : list;
  } catch {
    // Database offline fallback
  }

  if (patientId === 'demo-patient-001') {
    const result: PrescriptionEntity[] = [];
    for (const p of PRESCRIPTIONS_MAP.values()) {
      if (p.patientId === patientId) {
        if (!status || p.status.toLowerCase() === status.toLowerCase()) {
          result.push(p);
        }
      }
    }
    return result;
  }
  return [];
}

export async function storeFindPrescriptionById(id: string, patientId: string): Promise<PrescriptionEntity | null> {
  try {
    const p = await prisma.patientPrescription.findFirst({
      where: { id, patientId },
      include: { doctor: true },
    });
    if (p) {
      const now = new Date();
      const rxDate = new Date(p.prescriptionDate);
      const diffDays = (now.getTime() - rxDate.getTime()) / (1000 * 3600 * 24);
      const compStatus = diffDays > 30 ? 'Expired' : diffDays > 14 ? 'Completed' : 'Active';
      return {
        id: p.id,
        patientId: p.patientId,
        doctorId: p.doctorId,
        doctorName: p.doctor?.name ?? null,
        appointmentId: p.appointmentId,
        prescriptionDate: p.prescriptionDate.toISOString(),
        diagnosis: p.diagnosis,
        instructions: p.instructions,
        medications: Array.isArray(p.medications) ? (p.medications as any) : [],
        pdfUrl: p.pdfUrl ?? `/api/patient/prescriptions/${p.id}/download`,
        status: compStatus,
        startDate: p.prescriptionDate.toISOString(),
        endDate: new Date(rxDate.getTime() + 14 * 86400000).toISOString(),
        createdAt: p.createdAt.toISOString(),
      };
    }

    const rx = await prisma.prescription.findFirst({
      where: { id, patientId },
      include: { doctor: true, items: true },
    });
    if (rx) {
      const now = new Date();
      const rxDate = new Date(rx.createdAt);
      const diffDays = (now.getTime() - rxDate.getTime()) / (1000 * 3600 * 24);
      const compStatus = rx.dispensed ? 'Completed' : diffDays > 30 ? 'Expired' : 'Active';
      return {
        id: rx.id,
        patientId: rx.patientId,
        doctorId: rx.doctorId,
        doctorName: rx.doctor?.name ?? null,
        appointmentId: null,
        prescriptionDate: rx.createdAt.toISOString(),
        diagnosis: rx.diagnosis,
        instructions: rx.clinicalNotes ?? (rx.followUpDays ? `Follow up in ${rx.followUpDays} days` : 'Take as directed'),
        medications: rx.items.map((item) => ({
          name: item.medicineName,
          dosage: item.dosage || 'Standard',
          frequency: String(item.frequency),
          duration: `${item.durationDays} days`,
          instructions: item.instructions ?? '',
          route: item.timing ?? 'Oral',
        })),
        pdfUrl: `/api/patient/prescriptions/${rx.id}/download`,
        status: compStatus,
        startDate: rx.createdAt.toISOString(),
        endDate: new Date(rxDate.getTime() + (rx.followUpDays || 7) * 86400000).toISOString(),
        createdAt: rx.createdAt.toISOString(),
      };
    }
  } catch {
    // Database offline fallback
  }

  const p = PRESCRIPTIONS_MAP.get(id);
  if (!p || p.patientId !== patientId) return null;
  return p;
}

export async function storeFindReports(
  patientId: string,
  options?: { search?: string; category?: string; startDate?: string; endDate?: string; sort?: 'newest' | 'oldest' },
): Promise<LabReportEntity[]> {
  try {
    const dbDocs = await prisma.medicalDocument.findMany({
      where: { patientId, type: 'LAB_REPORT' },
      include: { extractedData: true },
      orderBy: { createdAt: options?.sort === 'oldest' ? 'asc' : 'desc' },
    });
    let list: LabReportEntity[] = dbDocs.map((doc) => ({
      id: doc.id,
      patientId: doc.patientId,
      sessionId: doc.sessionId,
      title: doc.originalFilename.replace(/\.[^/.]+$/, ''),
      testDate: doc.createdAt.toISOString(),
      category: 'Biochemistry / Pathology',
      facilityName: 'AIIMS Central Pathology Laboratory',
      doctorName: 'Dr. Suresh Sen (Pathologist)',
      departmentName: 'Pathology & Laboratory Medicine',
      status: 'COMPLETED',
      originalFilename: doc.originalFilename,
      ocrText: doc.ocrText,
      parameters: doc.extractedData.map((d) => ({
        name: d.fieldType,
        value: d.fieldValue,
        unit: 'mg/dL',
        referenceRange: 'Normal',
        status: 'NORMAL' as const,
      })),
      doctorNotes: 'Verified diagnostic findings. Normal physiological limits.',
      fileUrl: `/api/patient/reports/${doc.id}/download`,
      createdAt: doc.createdAt.toISOString(),
    }));

    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          (r.doctorNotes && r.doctorNotes.toLowerCase().includes(q)),
      );
    }

    if (options?.category && options.category !== 'ALL') {
      list = list.filter((r) => r.category.toLowerCase().includes(options.category!.toLowerCase()));
    }

    if (options?.startDate) {
      list = list.filter((r) => new Date(r.testDate).getTime() >= new Date(options.startDate!).getTime());
    }

    if (options?.endDate) {
      list = list.filter((r) => new Date(r.testDate).getTime() <= new Date(options.endDate!).getTime());
    }

    list.sort((a, b) => {
      const diff = new Date(b.testDate).getTime() - new Date(a.testDate).getTime();
      return options?.sort === 'oldest' ? -diff : diff;
    });

    return list;
  } catch {
    // Database offline fallback
  }

  if (patientId === 'demo-patient-001') {
    let list: LabReportEntity[] = [];
    for (const r of REPORTS_MAP.values()) {
      if (r.patientId === patientId) {
        list.push(r);
      }
    }

    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          (r.doctorNotes && r.doctorNotes.toLowerCase().includes(q)),
      );
    }

    if (options?.category && options.category !== 'ALL') {
      list = list.filter((r) => r.category.toLowerCase().includes(options.category!.toLowerCase()));
    }

    if (options?.startDate) {
      list = list.filter((r) => new Date(r.testDate).getTime() >= new Date(options.startDate!).getTime());
    }

    if (options?.endDate) {
      list = list.filter((r) => new Date(r.testDate).getTime() <= new Date(options.endDate!).getTime());
    }

    list.sort((a, b) => {
      const diff = new Date(b.testDate).getTime() - new Date(a.testDate).getTime();
      return options?.sort === 'oldest' ? -diff : diff;
    });

    return list;
  }

  return [];
}

export async function storeFindReportById(id: string, patientId: string): Promise<LabReportEntity | null> {
  try {
    const doc = await prisma.medicalDocument.findFirst({
      where: { id, patientId },
      include: { extractedData: true },
    });
    if (doc) {
      return {
        id: doc.id,
        patientId: doc.patientId,
        sessionId: doc.sessionId,
        title: doc.originalFilename.replace(/\.[^/.]+$/, ''),
        testDate: doc.createdAt.toISOString(),
        category: 'Biochemistry / Pathology',
        facilityName: 'AIIMS Central Pathology Laboratory',
        doctorName: 'Dr. Suresh Sen (Pathologist)',
        departmentName: 'Pathology & Laboratory Medicine',
        status: 'COMPLETED',
        originalFilename: doc.originalFilename,
        ocrText: doc.ocrText,
        parameters: doc.extractedData.map((d) => ({
          name: d.fieldType,
          value: d.fieldValue,
          unit: 'mg/dL',
          referenceRange: 'Normal',
          status: 'NORMAL' as const,
        })),
        doctorNotes: 'Verified diagnostic findings. Normal physiological limits.',
        fileUrl: `/api/patient/reports/${doc.id}/download`,
        createdAt: doc.createdAt.toISOString(),
      };
    }
  } catch {
    // Database offline fallback
  }

  const r = REPORTS_MAP.get(id);
  if (!r || r.patientId !== patientId) return null;
  return r;
}

export async function storeFindInvoices(patientId: string, status?: string): Promise<BillingInvoiceEntity[]> {
  try {
    const where: any = { patientId };
    if (status) where.status = status;
    const dbInvoices = await prisma.billingInvoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return dbInvoices.map((inv) => ({
      id: inv.id,
      patientId: inv.patientId,
      appointmentId: inv.appointmentId,
      invoiceNumber: inv.invoiceNumber,
      description: inv.description,
      department: inv.department,
      totalAmount: inv.totalAmount,
      discountAmount: inv.discountAmount,
      netAmount: inv.netAmount,
      status: inv.status,
      paymentMethod: inv.paymentMethod,
      paymentDate: inv.paymentDate ? inv.paymentDate.toISOString() : null,
      transactionReference: inv.transactionReference,
      items: Array.isArray(inv.items) ? (inv.items as any) : null,
      createdAt: inv.createdAt.toISOString(),
      updatedAt: inv.updatedAt.toISOString(),
    }));
  } catch {
    // Database offline fallback
  }

  if (patientId === 'demo-patient-001') {
    const result: BillingInvoiceEntity[] = [];
    for (const inv of INVOICES_MAP.values()) {
      if (inv.patientId === patientId) {
        if (!status || inv.status === status) {
          result.push(inv);
        }
      }
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return [];
}

export async function storePayInvoice(
  id: string,
  patientId: string,
  paymentMethod: PaymentMethod,
  txRef: string,
): Promise<BillingInvoiceEntity | null> {
  try {
    const updated = await prisma.billingInvoice.update({
      where: { id },
      data: {
        status: 'PAID',
        paymentMethod,
        paymentDate: new Date(),
        transactionReference: txRef,
      },
    });
    if (updated) {
      return {
        id: updated.id,
        patientId: updated.patientId,
        appointmentId: updated.appointmentId,
        invoiceNumber: updated.invoiceNumber,
        description: updated.description,
        department: updated.department,
        totalAmount: updated.totalAmount,
        discountAmount: updated.discountAmount,
        netAmount: updated.netAmount,
        status: updated.status,
        paymentMethod: updated.paymentMethod,
        paymentDate: updated.paymentDate ? updated.paymentDate.toISOString() : null,
        transactionReference: updated.transactionReference,
        items: Array.isArray(updated.items) ? (updated.items as any) : null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    }
  } catch {
    // Database offline fallback
  }

  const inv = INVOICES_MAP.get(id);
  if (!inv || inv.patientId !== patientId) return null;

  inv.status = 'PAID';
  inv.paymentMethod = paymentMethod;
  inv.paymentDate = new Date().toISOString();
  inv.transactionReference = txRef;
  inv.updatedAt = new Date().toISOString();
  INVOICES_MAP.set(id, inv);
  return inv;
}

export async function storeFindNotifications(patientId: string): Promise<PatientNotificationEntity[]> {
  try {
    const dbNotifs = await prisma.patientNotification.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return dbNotifs.map((n) => ({
      id: n.id,
      patientId: n.patientId,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.read,
      actionUrl: n.actionUrl,
      createdAt: n.createdAt.toISOString(),
    }));
  } catch {
    // Database offline fallback
  }

  if (patientId === 'demo-patient-001') {
    const result: PatientNotificationEntity[] = [];
    for (const n of NOTIFICATIONS_MAP.values()) {
      if (n.patientId === patientId) {
        result.push(n);
      }
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return [];
}

export async function storeMarkNotificationRead(id: string, patientId: string): Promise<void> {
  try {
    await prisma.patientNotification.updateMany({
      where: { id, patientId },
      data: { read: true },
    });
  } catch {
    // Database offline fallback
  }

  const n = NOTIFICATIONS_MAP.get(id);
  if (n && n.patientId === patientId) {
    n.read = true;
    NOTIFICATIONS_MAP.set(id, n);
  }
}

export async function storeMarkAllNotificationsRead(patientId: string): Promise<void> {
  try {
    await prisma.patientNotification.updateMany({
      where: { patientId, read: false },
      data: { read: true },
    });
  } catch {
    // Database offline fallback
  }

  for (const [id, n] of NOTIFICATIONS_MAP.entries()) {
    if (n.patientId === patientId) {
      n.read = true;
      NOTIFICATIONS_MAP.set(id, n);
    }
  }
}

export async function getAllBookedSlots(doctorId?: string, date?: string): Promise<string[]> {
  const booked: string[] = [];
  if (!date) return booked;

  try {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const where: any = {
      appointmentDate: { gte: startOfDay, lte: endOfDay },
      status: { notIn: ['CANCELLED'] },
    };
    if (doctorId) where.doctorId = doctorId;

    const dbAppts = await prisma.appointment.findMany({
      where,
      select: { timeSlot: true },
    });

    for (const a of dbAppts) {
      if (a.timeSlot && !booked.includes(a.timeSlot)) {
        booked.push(a.timeSlot);
      }
    }
  } catch {
    // Database offline fallback
  }

  try {
    const targetDateStr = new Date(date).toISOString().split('T')[0];
    for (const appt of APPOINTMENTS_MAP.values()) {
      if (appt.status === 'CANCELLED') continue;
      const apptDateStr = new Date(appt.appointmentDate).toISOString().split('T')[0];
      if (apptDateStr === targetDateStr) {
        if (!doctorId || appt.doctorId === doctorId) {
          if (!booked.includes(appt.timeSlot)) {
            booked.push(appt.timeSlot);
          }
        }
      }
    }
  } catch {}

  return booked;
}
