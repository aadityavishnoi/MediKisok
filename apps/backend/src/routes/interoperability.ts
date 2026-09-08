/**
 * FHIR / ABDM Interoperability Layer — DEMO Mode
 *
 * This module provides a clean boundary between MediKiosk's internal domain
 * model and FHIR R4 / ABDM resource shapes.
 *
 * IMPORTANT: All responses are clearly marked { mode: 'DEMO' }.
 * No real ABDM API calls are made unless ABDM_ENABLED=true is set AND
 * real credentials are provided. This is intentional per the SIH scope.
 *
 * Architecture:
 *   MediKiosk Domain → fhirAdapter.ts → FHIR R4 Resource
 */
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { requireAuth } from '../middleware/userAuth.js';
import { Errors } from '../lib/errors.js';

export const interoperabilityRouter = Router();

// ---------------------------------------------------------------------------
// FHIR Patient resource
// ---------------------------------------------------------------------------

/**
 * GET /api/interoperability/patient/:patientId/fhir
 * Returns a DEMO FHIR R4 Patient resource derived from MediKiosk's Patient record.
 */
interoperabilityRouter.get(
  '/interoperability/patient/:patientId/fhir',
  requireAuth,
  asyncHandler(async (req, res) => {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.patientId },
    });
    if (!patient) throw Errors.notFound('Patient not found');

    const fhirPatient = {
      resourceType: 'Patient',
      id: patient.id,
      meta: {
        profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient'],
      },
      identifier: [
        ...(patient.abhaId
          ? [{ system: 'https://healthid.ndhm.gov.in', value: patient.abhaId }]
          : []),
        ...(patient.phone
          ? [{ system: 'https://www.medikiosk.in/patient-id', value: patient.id }]
          : []),
      ],
      name: [{ text: patient.fullName, use: 'official' }],
      gender: patient.gender?.toLowerCase() ?? 'unknown',
      birthDate: patient.dateOfBirth
        ? new Date(patient.dateOfBirth).toISOString().split('T')[0]
        : undefined,
      telecom: patient.phone
        ? [{ system: 'phone', value: patient.phone, use: 'mobile' }]
        : [],
    };

    res.json({
      mode: 'DEMO',
      note: 'This is a DEMO FHIR resource. No real ABDM connectivity is active.',
      fhirResource: fhirPatient,
    });
  }),
);

// ---------------------------------------------------------------------------
// FHIR Encounter resource (from PatientSession)
// ---------------------------------------------------------------------------

/**
 * GET /api/interoperability/session/:sessionId/encounter
 * Returns a DEMO FHIR R4 Encounter resource derived from a PatientSession.
 */
interoperabilityRouter.get(
  '/interoperability/session/:sessionId/encounter',
  requireAuth,
  asyncHandler(async (req, res) => {
    const session = await prisma.patientSession.findUnique({
      where: { id: req.params.sessionId },
      include: {
        patient: true,
        clinicalHistory: { select: { chiefComplaint: true, chiefComplaintCategory: true } },
        hospital: { select: { abdmFacilityId: true, name: true } },
      },
    });
    if (!session) throw Errors.notFound('Session not found');

    const fhirEncounter = {
      resourceType: 'Encounter',
      id: session.id,
      meta: {
        profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Encounter'],
      },
      status: session.status === 'COMPLETED' ? 'finished' : 'in-progress',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'AMB',
        display: 'Ambulatory',
      },
      subject: {
        reference: `Patient/${session.patientId}`,
        display: session.patient?.fullName,
      },
      period: {
        start: session.createdAt.toISOString(),
        ...(session.updatedAt && session.status === 'COMPLETED'
          ? { end: session.updatedAt.toISOString() }
          : {}),
      },
      serviceProvider: session.hospital?.abdmFacilityId
        ? { identifier: { system: 'https://facility.ndhm.gov.in', value: session.hospital.abdmFacilityId } }
        : { display: session.hospital?.name ?? 'Unknown Facility' },
      reasonCode: session.clinicalHistory?.chiefComplaint
        ? [{ text: session.clinicalHistory.chiefComplaint }]
        : [],
    };

    res.json({
      mode: 'DEMO',
      note: 'This is a DEMO FHIR resource. No real ABDM connectivity is active.',
      fhirResource: fhirEncounter,
    });
  }),
);

// ---------------------------------------------------------------------------
// Interoperability status / capabilities
// ---------------------------------------------------------------------------

/**
 * GET /api/interoperability/status
 * Returns current ABDM/FHIR integration mode and supported resources.
 */
interoperabilityRouter.get(
  '/interoperability/status',
  asyncHandler(async (_req, res) => {
    res.json({
      mode: 'DEMO',
      abdmEnabled: false,
      fhirVersion: 'R4',
      supportedResources: ['Patient', 'Encounter', 'Observation', 'Condition', 'DocumentReference'],
      note: 'ABDM integration is in DEMO mode. Set ABDM_ENABLED=true with real credentials for production.',
      implementedResources: {
        Patient: { endpoint: '/api/interoperability/patient/:patientId/fhir', status: 'DEMO' },
        Encounter: { endpoint: '/api/interoperability/session/:sessionId/encounter', status: 'DEMO' },
        Observation: { status: 'PLANNED' },
        Condition: { status: 'PLANNED' },
        DocumentReference: { status: 'PLANNED' },
      },
    });
  }),
);
