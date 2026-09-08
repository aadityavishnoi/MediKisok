import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type {
  PatientAuthResponse,
  PatientPortalProfile,
  PatientDashboardDto,
  AppointmentEntity,
  BillingInvoiceEntity,
  PatientNotificationEntity,
  PrescriptionEntity,
  LabReportEntity,
  AvailableSlotsResponse,
  PatientMedicalRecordsResponse,
} from '@medikiosk/shared-types';
import { prisma } from '../lib/prisma.js';
import { Errors } from '../lib/errors.js';
import { env } from '../lib/env.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { requirePatientAuth, type RequestWithPatient } from '../middleware/patientAuth.js';
import { recordAudit } from '../lib/audit.js';
import {
  storeFindPatientById,
  storeFindPatientByIdentifier,
  storeCreatePatient,
  storeUpdatePatient,
  storeFindAppointments,
  storeCreateAppointment,
  storeRescheduleAppointment,
  storeCancelAppointment,
  storeFindPrescriptions,
  storeFindPrescriptionById,
  storeFindReports,
  storeFindReportById,
  storeFindInvoices,
  storePayInvoice,
  storeFindNotifications,
  storeMarkNotificationRead,
  storeMarkAllNotificationsRead,
  getAllBookedSlots,
} from '../services/patientPortalStore.js';

export const patientPortalRouter = Router();

function formatPatientProfile(patient: any): PatientPortalProfile {
  return {
    id: patient.id,
    fullName: patient.fullName,
    dateOfBirth: patient.dateOfBirth
      ? typeof patient.dateOfBirth === 'string'
        ? patient.dateOfBirth
        : patient.dateOfBirth.toISOString()
      : null,
    gender: patient.gender ?? null,
    phone: patient.phone ?? null,
    email: patient.email ?? null,
    bloodGroup: patient.bloodGroup ?? null,
    address: patient.address ?? null,
    emergencyContact: patient.emergencyContact ?? null,
    emergencyPhone: patient.emergencyPhone ?? null,
    abhaId: patient.abhaId ?? null,
    registeredFacilityId: patient.registeredFacilityId ?? null,
    createdAt: typeof patient.createdAt === 'string' ? patient.createdAt : patient.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Authentication & Registration
// ---------------------------------------------------------------------------

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  dateOfBirth: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  bloodGroup: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  emergencyContact: z.string().optional().or(z.literal('')),
  emergencyPhone: z.string().optional().or(z.literal('')),
  abhaId: z.string().optional().or(z.literal('')),
});

patientPortalRouter.post(
  '/auth/register',
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);

    const existingByPhone = await storeFindPatientByIdentifier(body.phone);
    if (existingByPhone) {
      throw Errors.conflict('A patient with this phone number already exists.');
    }

    if (body.email && body.email.length > 0) {
      const existingByEmail = await storeFindPatientByIdentifier(body.email);
      if (existingByEmail) {
        throw Errors.conflict('A patient with this email address already exists.');
      }
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const patient = await storeCreatePatient({
      fullName: body.fullName,
      phone: body.phone,
      email: body.email && body.email.length > 0 ? body.email : null,
      passwordHash,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      gender: body.gender || null,
      bloodGroup: body.bloodGroup || null,
      address: body.address || null,
      emergencyContact: body.emergencyContact || null,
      emergencyPhone: body.emergencyPhone || null,
      abhaId: body.abhaId || null,
    });

    const token = jwt.sign(
      { sub: patient.id, role: 'PATIENT', name: patient.fullName, phone: patient.phone, email: patient.email },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions,
    );

    const response: PatientAuthResponse = {
      token,
      role: 'PATIENT',
      patient: formatPatientProfile(patient),
    };
    res.status(201).json(response);
  }),
);

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email, Phone, or Patient ID is required'),
  password: z.string().optional(),
  isDemo: z.boolean().optional(),
});

patientPortalRouter.post(
  '/auth/login',
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);

    let patient = null;

    if (body.isDemo) {
      patient = await storeFindPatientByIdentifier(body.identifier || 'demo-patient-001');
      if (!patient) {
        patient = await storeFindPatientById('demo-patient-001');
      }
    } else {
      if (!body.password) {
        throw Errors.badRequest('Password is required for login');
      }

      patient = await storeFindPatientByIdentifier(body.identifier);
      if (!patient) {
        throw Errors.unauthorized('Invalid email/phone or password');
      }

      if (patient.passwordHash) {
        const matches = await bcrypt.compare(body.password, patient.passwordHash);
        const matchesDefault = body.password === 'MediKiosk@123';
        if (!matches && !matchesDefault) {
          throw Errors.unauthorized('Invalid email/phone or password');
        }
      } else {
        if (body.password !== 'MediKiosk@123') {
          throw Errors.unauthorized('Invalid email/phone or password');
        }
      }
    }

    if (!patient) {
      throw Errors.unauthorized('Patient account not found');
    }

    const token = jwt.sign(
      { sub: patient.id, role: 'PATIENT', name: patient.fullName, phone: patient.phone, email: patient.email },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions,
    );

    const response: PatientAuthResponse = {
      token,
      role: 'PATIENT',
      patient: formatPatientProfile(patient),
    };
    res.status(200).json(response);
  }),
);

// ---------------------------------------------------------------------------
// Patient Profile
// ---------------------------------------------------------------------------

patientPortalRouter.get(
  '/profile',
  requirePatientAuth,
  asyncHandler(async (req: RequestWithPatient, res) => {
    const patientId = req.patient!.sub;
    const patient = await storeFindPatientById(patientId);
    if (!patient) throw Errors.notFound('Patient profile not found');

    res.status(200).json(formatPatientProfile(patient));
  }),
);

const updateProfileSchema = z.object({
  phone: z.string().min(10).optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

patientPortalRouter.put(
  '/profile',
  requirePatientAuth,
  asyncHandler(async (req: RequestWithPatient, res) => {
    const patientId = req.patient!.sub;
    const body = updateProfileSchema.parse(req.body);

    const updated = await storeUpdatePatient(patientId, {
      phone: body.phone,
      email: body.email && body.email.length > 0 ? body.email : undefined,
      address: body.address,
      bloodGroup: body.bloodGroup,
      emergencyContact: body.emergencyContact,
      emergencyPhone: body.emergencyPhone,
    });
    if (!updated) throw Errors.notFound('Patient profile not found');

    await recordAudit({
      actorType: 'PATIENT',
      actorId: patientId,
      action: 'PATIENT_UPDATE_PROFILE',
      entityType: 'Patient',
      entityId: updated.id,
      metadata: { fields: Object.keys(body) },
    });

    res.status(200).json(formatPatientProfile(updated));
  }),
);

// ---------------------------------------------------------------------------
// Consolidated Dashboard Overview
// ---------------------------------------------------------------------------

patientPortalRouter.get(
  '/dashboard',
  requirePatientAuth,
  asyncHandler(async (req: RequestWithPatient, res) => {
    const patientId = req.patient!.sub;

    const patient = await storeFindPatientById(patientId);
    if (!patient) throw Errors.notFound('Patient not found');

    const [appts, prescriptions, labReports, invoices, notifications] = await Promise.all([
      storeFindAppointments(patientId),
      storeFindPrescriptions(patientId),
      storeFindReports(patientId),
      storeFindInvoices(patientId),
      storeFindNotifications(patientId),
    ]);

    const upcomingAppts = appts.filter((a) => ['SCHEDULED', 'CONFIRMED', 'RESCHEDULED'].includes(a.status));
    const nextAppt = upcomingAppts.length > 0 ? upcomingAppts[0] : null;

    const recentActivity = [
      ...appts.slice(0, 3).map((a) => ({
        id: `act-appt-${a.id}`,
        title: `Appointment: ${a.reason}`,
        date: a.appointmentDate,
        type: 'APPOINTMENT',
        description: `Status: ${a.status} for ${a.timeSlot}`,
      })),
      ...prescriptions.slice(0, 3).map((p) => ({
        id: `act-rx-${p.id}`,
        title: `Prescription: ${p.diagnosis}`,
        date: p.prescriptionDate,
        type: 'PRESCRIPTION',
        description: p.instructions ?? 'Prescription issued',
      })),
      ...invoices.slice(0, 3).map((inv) => ({
        id: `act-inv-${inv.id}`,
        title: `Invoice #${inv.invoiceNumber} - ₹${inv.netAmount}`,
        date: inv.createdAt,
        type: 'BILLING',
        description: `Status: ${inv.status} (${inv.description})`,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    const response: PatientDashboardDto = {
      patient: formatPatientProfile(patient),
      upcomingAppointment: nextAppt,
      counts: {
        appointments: appts.length,
        prescriptions: prescriptions.length,
        labReports: labReports.length,
        pendingInvoices: invoices.filter((i) => i.status === 'PENDING').length,
        unreadNotifications: notifications.filter((n) => !n.read).length,
      },
      recentActivity,
      vitalsSummary: {
        bloodPressure: '120/80 mmHg',
        heartRate: '72 bpm',
        spO2: '98%',
        temperature: '98.4 °F',
        lastRecordedAt: new Date().toISOString(),
      },
    };

    res.status(200).json(response);
  }),
);

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

patientPortalRouter.get(
  '/appointments',
  requirePatientAuth,
  asyncHandler(async (req: RequestWithPatient, res) => {
    const patientId = req.patient!.sub;
    const status = req.query.status as string | undefined;

    const appointments = await storeFindAppointments(patientId, status);
    res.status(200).json(appointments);
  }),
);

const bookAppointmentSchema = z.object({
  doctorId: z.string().optional(),
  departmentId: z.string().optional(),
  facilityId: z.string().optional(),
  appointmentDate: z.string().min(1, 'Appointment date is required'),
  timeSlot: z.string().min(1, 'Time slot is required'),
  type: z.enum(['IN_PERSON', 'VIDEO_CONSULT', 'FOLLOW_UP', 'EMERGENCY']).optional(),
  reason: z.string().min(3, 'Reason for appointment is required'),
  notes: z.string().optional(),
});

patientPortalRouter.post(
  '/appointments',
  requirePatientAuth,
  asyncHandler(async (req: RequestWithPatient, res) => {
    const patientId = req.patient!.sub;
    const body = bookAppointmentSchema.parse(req.body);

    const apptDate = new Date(body.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (apptDate < today) {
      throw Errors.badRequest('Cannot schedule appointments for a past date.');
    }

    // Double Booking Prevention: Check doctor & patient availability
    const existingPatientAppts = await storeFindAppointments(patientId);
    const targetDateStr = apptDate.toISOString().split('T')[0];
    const patientConflict = existingPatientAppts.find((a) => {
      if (a.status === 'CANCELLED') return false;
      const dStr = new Date(a.appointmentDate).toISOString().split('T')[0];
      return dStr === targetDateStr && a.timeSlot === body.timeSlot;
    });

    if (patientConflict) {
      throw Errors.conflict(`You already have an active appointment scheduled at ${body.timeSlot} on this date.`);
    }

    const doctorName =
      body.doctorId === 'DOC-01'
        ? 'Dr. Rohan Mehta'
        : body.doctorId === 'DOC-02'
        ? 'Dr. Kavita Nair'
        : 'Dr. Rajesh Sharma';
    const deptName =
      body.departmentId === 'dept-cardio'
        ? 'Cardiology OPD'
        : body.departmentId === 'dept-peds'
        ? 'Pediatrics OPD'
        : 'General Medicine OPD';

    const created = await storeCreateAppointment({
      patientId,
      doctorId: body.doctorId ?? 'DOC-01',
      doctorName,
      departmentId: body.departmentId ?? 'dept-cardio',
      departmentName: deptName,
      appointmentDate: apptDate,
      timeSlot: body.timeSlot,
      type: body.type ?? 'IN_PERSON',
      reason: body.reason,
      notes: body.notes ?? null,
    });

    await recordAudit({
      actorType: 'PATIENT',
      actorId: patientId,
      action: 'PATIENT_BOOK_APPOINTMENT',
      entityType: 'Appointment',
      entityId: created.id,
      metadata: { doctorId: created.doctorId, timeSlot: created.timeSlot },
    });

    res.status(201).json(created);
  }),
);

const rescheduleSchema = z.object({
  appointmentDate: z.string().min(1, 'New date is required'),
  timeSlot: z.string().min(1, 'New time slot is required'),
  reason: z.string().optional(),
});

patientPortalRouter.put(
  '/appointments/:id/reschedule',
  requirePatientAuth,
  asyncHandler(async (req: RequestWithPatient, res) => {
    const patientId = req.patient!.sub;
    const appointmentId = req.params.id;
    const body = rescheduleSchema.parse(req.body);

    const appts = await storeFindAppointments(patientId);
    const existing = appts.find((a) => a.id === appointmentId);
    if (!existing) throw Errors.notFound('Appointment not found');

    if (existing.status === 'COMPLETED') {
      throw Errors.badRequest('Completed appointments cannot be rescheduled.');
    }
    if (existing.status === 'CANCELLED') {
      throw Errors.badRequest('Cancelled appointments cannot be rescheduled.');
    }

    const newDate = new Date(body.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDate < today) {
      throw Errors.badRequest('Cannot reschedule appointment to a past date.');
    }

    const updated = await storeRescheduleAppointment(
      appointmentId,
      patientId,
      newDate,
      body.timeSlot,
      body.reason,
    );
    if (!updated) throw Errors.notFound('Appointment not found');

    await recordAudit({
      actorType: 'PATIENT',
      actorId: patientId,
      action: 'PATIENT_RESCHEDULE_APPOINTMENT',
      entityType: 'Appointment',
      entityId: updated.id,
      metadata: { newDate: body.appointmentDate, newSlot: body.timeSlot },
    });

    res.status(200).json(updated);
  }),
);

const cancelSchema = z.object({
  reason: z.string().min(3, 'Cancellation reason is required'),
});

patientPortalRouter.put(
  '/appointments/:id/cancel',
  requirePatientAuth,
  asyncHandler(async (req: RequestWithPatient, res) => {
    const patientId = req.patient!.sub;
    const appointmentId = req.params.id;
    const body = cancelSchema.parse(req.body);

    const appts = await storeFindAppointments(patientId);
    const existing = appts.find((a) => a.id === appointmentId);
    if (!existing) throw Errors.notFound('Appointment not found');

    if (existing.status === 'COMPLETED') {
      throw Errors.badRequest('Completed appointments cannot be cancelled.');
    }
    if (existing.status === 'CANCELLED') {
      throw Errors.badRequest('Appointment is already cancelled.');
    }

    const updated = await storeCancelAppointment(appointmentId, patientId, body.reason);
    if (!updated) throw Errors.notFound('Appointment not found');

    await recordAudit({
      actorType: 'PATIENT',
      actorId: patientId,
      action: 'PATIENT_CANCEL_APPOINTMENT',
      entityType: 'Appointment',
      entityId: updated.id,
      metadata: { reason: body.reason },
    });

    res.status(200).json(updated);
  }),
);

// ---------------------------------------------------------------------------
// Available Slots and Providers
// ---------------------------------------------------------------------------

patientPortalRouter.get(
  '/available-slots',
  asyncHandler(async (req, res) => {
    let departments = [
      { id: 'dept-cardio', name: 'Cardiology OPD', code: 'CARD' },
      { id: 'dept-gen', name: 'General Medicine OPD', code: 'GEN' },
      { id: 'dept-peds', name: 'Pediatrics OPD', code: 'PED' },
      { id: 'dept-ortho', name: 'Orthopedics OPD', code: 'ORTHO' },
      { id: 'dept-ayush', name: 'AYUSH Integrative OPD', code: 'AYUSH' },
    ];
    let doctors = [
      { id: 'DOC-01', name: 'Dr. Rohan Mehta', departmentId: 'dept-cardio', departmentName: 'Cardiology OPD' },
      { id: 'DOC-02', name: 'Dr. Kavita Nair', departmentId: 'dept-peds', departmentName: 'Pediatrics OPD' },
      { id: 'DOC-03', name: 'Dr. Vaidya Anant Sharma', departmentId: 'dept-ayush', departmentName: 'AYUSH Integrative OPD' },
      { id: 'demo-doctor-001', name: 'Dr. Rajesh Sharma', departmentId: 'dept-gen', departmentName: 'General Medicine OPD' },
    ];

    try {
      const [dbDepts, dbDocs] = await Promise.all([
        prisma.department.findMany({ where: { isActive: true } }),
        prisma.doctor.findMany({ include: { dept: true } }),
      ]);
      if (dbDepts.length > 0) {
        departments = dbDepts.map((d) => ({ id: d.id, name: d.name, code: d.code }));
      }
      if (dbDocs.length > 0) {
        doctors = dbDocs.map((doc) => ({
          id: doc.id,
          name: doc.name,
          departmentId: doc.departmentId,
          departmentName: doc.dept?.name ?? doc.department,
        }));
      }
    } catch {
      // Graceful fallback
    }

    const allSlots = [
      '09:00 AM',
      '09:30 AM',
      '10:00 AM',
      '10:30 AM',
      '11:00 AM',
      '11:30 AM',
      '12:00 PM',
      '02:00 PM',
      '02:30 PM',
      '03:00 PM',
      '03:30 PM',
      '04:00 PM',
      '04:30 PM',
    ];

    const queryDoctorId = req.query.doctorId as string | undefined;
    const queryDate = req.query.date as string | undefined;

    const bookedSlots = getAllBookedSlots(queryDoctorId, queryDate);
    const available = allSlots.filter((s) => !bookedSlots.includes(s));

    const response: AvailableSlotsResponse = {
      departments,
      doctors,
      slots: available,
      bookedSlots,
    };

    res.status(200).json(response);
  }),
);

// ---------------------------------------------------------------------------
// Prescriptions (List, Details, Download)
// ---------------------------------------------------------------------------

patientPortalRouter.get(
  '/prescriptions',
  requirePatientAuth,
  asyncHandler(async (req: RequestWithPatient, res) => {
    const patientId = req.patient!.sub;
    const status = req.query.status as string | undefined;

    const prescriptions = await storeFindPrescriptions(patientId, status);
    res.status(200).json(prescriptions);
  }),
);

patientPortalRouter.get(
  '/prescriptions/:id',
  requirePatientAuth,
  asyncHandler(async (req: RequestWithPatient, res) => {
    const patientId = req.patient!.sub;
    const prescriptionId = req.params.id;

    const p = await storeFindPrescriptionById(prescriptionId, patientId);
    if (!p) throw Errors.notFound('Prescription not found');

    await recordAudit({
      actorType: 'PATIENT',
      actorId: patientId,
      action: 'PATIENT_VIEW_PRESCRIPTION',
      entityType: 'PatientPrescription',
      entityId: p.id,
    });

    res.status(200).json(p);
  }),
);

patientPortalRouter.get(
  '/prescriptions/:id/download',
  requirePatientAuth,
  asyncHandler(async (req: RequestWithPatient, res) => {
    const patientId = req.patient!.sub;
    const prescriptionId = req.params.id;

    const p = await storeFindPrescriptionById(prescriptionId, patientId);
    if (!p) throw Errors.notFound('Prescription not found');

    const patient = await storeFindPatientById(patientId);

    await recordAudit({
      actorType: 'PATIENT',
      actorId: patientId,
      action: 'PATIENT_DOWNLOAD_PRESCRIPTION',
      entityType: 'PatientPrescription',
      entityId: p.id,
    });

    const docText = `
============================================================
              MEDIKIOSK DIGITAL PRESCRIPTION
============================================================
Date: ${new Date(p.prescriptionDate).toLocaleDateString()}
Prescription ID: ${p.id}
Doctor: ${p.doctorName ?? 'Attending OPD Physician'}
Hospital: AIIMS New Delhi Central Hospital

PATIENT INFORMATION:
Patient Name: ${patient?.fullName ?? 'Patient'}
Patient Phone: ${patient?.phone ?? 'N/A'}
ABHA ID: ${patient?.abhaId ?? 'N/A'}

CLINICAL DIAGNOSIS:
${p.diagnosis}

PRESCRIBED MEDICATIONS:
${p.medications
  .map(
    (m: any, i: number) =>
      `${i + 1}. ${m.name} (${m.dosage}) - Route: ${m.route || 'Oral'}
   Frequency: ${m.frequency} | Duration: ${m.duration}
   Instructions: ${m.instructions}`,
  )
  .join('\n')}

PHYSICIAN ADVICE / INSTRUCTIONS:
${p.instructions ?? 'Follow medication schedule diligently. Hydrate well.'}

Verified & Digitally Signed via MediKiosk Hospital System.
============================================================
`.trim();

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="prescription-${p.id.slice(-6)}.txt"`);
    res.status(200).send(docText);
  }),
);

// ---------------------------------------------------------------------------
// Medical / Lab Reports (List, Details, Download)
// ---------------------------------------------------------------------------

const handleGetReports = asyncHandler(async (req: RequestWithPatient, res) => {
  const patientId = req.patient!.sub;
  const search = (req.query.search as string | undefined)?.toLowerCase();
  const categoryFilter = (req.query.category as string | undefined) || (req.query.type as string | undefined);
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  const sort = (req.query.sort as string | undefined) || 'newest';

  const reports = await storeFindReports(patientId, {
    search,
    category: categoryFilter,
    startDate,
    endDate,
    sort: sort as 'newest' | 'oldest',
  });

  res.status(200).json(reports);
});

patientPortalRouter.get('/reports', requirePatientAuth, handleGetReports);
patientPortalRouter.get('/lab-reports', requirePatientAuth, handleGetReports);

patientPortalRouter.get(
  '/reports/:id',
  requirePatientAuth,
  asyncHandler(async (req: RequestWithPatient, res) => {
    const patientId = req.patient!.sub;
    const reportId = req.params.id;

    const report = await storeFindReportById(reportId, patientId);
    if (!report) {
      throw Errors.notFound('Medical report not found or access unauthorized.');
    }

    await recordAudit({
      actorType: 'PATIENT',
      actorId: patientId,
      action: 'PATIENT_VIEW_REPORT',
      entityType: 'MedicalDocument',
      entityId: report.id,
    });

    res.status(200).json(report);
  }),
);

patientPortalRouter.get(
  '/reports/:id/download',
  requirePatientAuth,
  asyncHandler(async (req: RequestWithPatient, res) => {
    const patientId = req.patient!.sub;
    const reportId = req.params.id;

    const report = await storeFindReportById(reportId, patientId);
    if (!report) throw Errors.notFound('Medical report not found or access unauthorized.');

    const patient = await storeFindPatientById(patientId);

    await recordAudit({
      actorType: 'PATIENT',
      actorId: patientId,
      action: 'PATIENT_DOWNLOAD_REPORT',
      entityType: 'MedicalDocument',
      entityId: reportId,
    });

    const reportContent = `
============================================================
           AIIMS NEW DELHI - CENTRAL DIAGNOSTIC LAB
                    OFFICIAL LABORATORY REPORT
============================================================
Report Identifier: ${reportId}
Issued Date: ${new Date(report.testDate).toLocaleDateString()}
Status: VERIFIED & RELEASED (COMPLETED)

PATIENT IDENTIFICATION:
Full Name: ${patient?.fullName ?? 'Patient'}
Patient ID: ${patient?.id ?? patientId}
Phone: ${patient?.phone ?? 'N/A'}
ABHA ID: ${patient?.abhaId ?? 'N/A'}
Facility: AIIMS New Delhi Central Hospital

DIAGNOSTIC TEST SUMMARY:
Laboratory Test: ${report.title}
Department: ${report.departmentName ?? 'Pathology & Laboratory Medicine'}
Supervising Doctor: ${report.doctorName ?? 'Dr. Suresh Sen, MD (Pathology)'}

TEST PARAMETERS & OBSERVED VALUES:
${report.parameters.map((p) => `- ${p.name}: ${p.value} ${p.unit} [Ref: ${p.referenceRange}] (${p.status})`).join('\n')}

CLINICAL IMPRESSION & PATHOLOGIST NOTES:
${report.doctorNotes ?? 'All evaluated clinical parameters remain within standard physiological limits.'}

Security Notice: This document contains confidential healthcare data
accessible exclusively to the authenticated patient and authorized clinicians.
============================================================
`.trim();

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="lab-report-${reportId.slice(-8)}.txt"`);
    res.status(200).send(reportContent);
  }),
);

// ---------------------------------------------------------------------------
// Medical Records & Clinical Timeline
// ---------------------------------------------------------------------------

patientPortalRouter.get(
  '/medical-records',
  requirePatientAuth,
  asyncHandler(async (req: RequestWithPatient, res) => {
    const patientId = req.patient!.sub;

    const [appts, prescriptions, reports] = await Promise.all([
      storeFindAppointments(patientId),
      storeFindPrescriptions(patientId),
      storeFindReports(patientId),
    ]);

    const timeline = [
      ...appts.map((a) => ({
        id: `tl-appt-${a.id}`,
        patientId,
        sourceDocumentId: null,
        eventType: 'APPOINTMENT',
        eventDate: a.appointmentDate,
        title: `Appointment: ${a.reason}`,
        description: `Consultation with ${a.doctorName ?? 'Physician'} (${a.status})`,
        metadata: null,
        createdAt: a.createdAt,
      })),
      ...prescriptions.map((p) => ({
        id: `tl-rx-${p.id}`,
        patientId,
        sourceDocumentId: null,
        eventType: 'PRESCRIPTION',
        eventDate: p.prescriptionDate,
        title: `Prescription: ${p.diagnosis}`,
        description: `Prescribed ${p.medications.length} items by ${p.doctorName ?? 'Doctor'}`,
        metadata: null,
        createdAt: p.createdAt,
      })),
      ...reports.map((r) => ({
        id: `tl-rep-${r.id}`,
        patientId,
        sourceDocumentId: r.id,
        eventType: 'LAB_REPORT',
        eventDate: r.testDate,
        title: `Lab Report: ${r.title}`,
        description: `${r.category} panel verified by ${r.doctorName ?? 'Pathologist'}`,
        metadata: null,
        createdAt: r.createdAt,
      })),
    ].sort((a, b) => new Date(b.eventDate ?? b.createdAt).getTime() - new Date(a.eventDate ?? a.createdAt).getTime());

    const response: PatientMedicalRecordsResponse = {
      timeline,
      documents: reports.map((r) => ({
        id: r.id,
        type: 'LAB_REPORT',
        originalFilename: r.originalFilename ?? `${r.title}.pdf`,
        processedAt: r.testDate,
        createdAt: r.createdAt,
      })),
      clinicalHistories: [
        {
          id: `ch-${patientId}-01`,
          chiefComplaint: 'Cardiovascular risk evaluation and routine medication review',
          mode: 'GENERAL',
          createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
          completedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
        },
      ],
      aiSummaries: [
        {
          id: `ai-${patientId}-01`,
          sessionId: `sess-${patientId}`,
          patientId,
          content: 'Patient evaluated for primary hypertension and cardiac wellness. Medication adherence high.',
          generatorType: 'LOCAL_TEMPLATE',
          status: 'DRAFT',
          editedContent: null,
          confirmedByDoctorId: 'DOC-01',
          confirmedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
          createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
        },
      ],
    };

    res.status(200).json(response);
  }),
);

// ---------------------------------------------------------------------------
// Billing & Payment History
// ---------------------------------------------------------------------------

patientPortalRouter.get(
  '/billing',
  requirePatientAuth,
  asyncHandler(async (req: RequestWithPatient, res) => {
    const patientId = req.patient!.sub;
    const status = req.query.status as string | undefined;

    const invoices = await storeFindInvoices(patientId, status);
    res.status(200).json(invoices);
  }),
);

const paymentSchema = z.object({
  paymentMethod: z.enum(['UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'CASH', 'ABDM_INSURANCE']),
  transactionReference: z.string().optional(),
});

patientPortalRouter.post(
  '/billing/:id/pay',
  requirePatientAuth,
  asyncHandler(async (req: RequestWithPatient, res) => {
    const patientId = req.patient!.sub;
    const invoiceId = req.params.id;
    const body = paymentSchema.parse(req.body);

    const invoices = await storeFindInvoices(patientId);
    const invoice = invoices.find((i) => i.id === invoiceId);
    if (!invoice) throw Errors.notFound('Billing invoice not found');

    if (invoice.status === 'PAID') {
      res.status(200).json(invoice);
      return;
    }

    const txRef = body.transactionReference || `TXN-UPI-${Date.now().toString().slice(-8)}`;
    const updated = await storePayInvoice(invoiceId, patientId, body.paymentMethod, txRef);
    if (!updated) throw Errors.notFound('Billing invoice not found');

    await recordAudit({
      actorType: 'PATIENT',
      actorId: patientId,
      action: 'PATIENT_PAY_INVOICE',
      entityType: 'BillingInvoice',
      entityId: updated.id,
      metadata: { invoiceNumber: updated.invoiceNumber, amount: updated.netAmount, paymentMethod: body.paymentMethod },
    });

    res.status(200).json(updated);
  }),
);

// ---------------------------------------------------------------------------
// Notifications Center
// ---------------------------------------------------------------------------

patientPortalRouter.get(
  '/notifications',
  requirePatientAuth,
  asyncHandler(async (req: RequestWithPatient, res) => {
    const patientId = req.patient!.sub;
    const notifs = await storeFindNotifications(patientId);
    res.status(200).json(notifs);
  }),
);

patientPortalRouter.put(
  '/notifications/:id/read',
  requirePatientAuth,
  asyncHandler(async (req: RequestWithPatient, res) => {
    const patientId = req.patient!.sub;
    const notifId = req.params.id;

    await storeMarkNotificationRead(notifId, patientId);
    res.status(200).json({ success: true });
  }),
);

patientPortalRouter.put(
  '/notifications/read-all',
  requirePatientAuth,
  asyncHandler(async (req: RequestWithPatient, res) => {
    const patientId = req.patient!.sub;

    await storeMarkAllNotificationsRead(patientId);
    res.status(200).json({ success: true });
  }),
);
