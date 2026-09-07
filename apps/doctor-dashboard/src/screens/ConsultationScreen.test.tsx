import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockDetail = {
  sessionId: 's1',
  status: 'ROUTED',
  mode: 'GENERAL',
  language: 'EN',
  isDemo: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  patient: { id: 'p1', fullName: 'Rajesh Sharma', dateOfBirth: null, gender: 'Male', phone: null },
  consent: { status: 'GRANTED', language: 'EN', grantedAt: new Date().toISOString() },
  history: {
    id: 'h1',
    sessionId: 's1',
    patientId: 'p1',
    mode: 'GENERAL',
    chiefComplaint: 'Severe Angina with Breathlessness',
    hpi: [{ label: 'Onset', value: '2 hours ago' }],
    pastMedicalHistory: [],
    pastSurgicalHistory: [],
    currentMedications: [],
    drugAllergies: [{ label: 'Penicillin', value: 'Anaphylaxis' }],
    familyHistory: [],
    personalHistory: [],
    reviewOfSystems: [],
    previousInvestigations: [],
    ayushFields: null,
    completedAt: new Date().toISOString(),
  },
  alerts: [],
  documents: [],
  consultation: null,
  summary: {
    id: 'sum1',
    sessionId: 's1',
    patientId: 'p1',
    content: 'Patient reports severe chest pain radiating to left arm.',
    generatorType: 'LLM',
    status: 'DRAFT',
    editedContent: null,
    confirmedByDoctorId: null,
    confirmedAt: null,
    createdAt: new Date().toISOString(),
  },
};

const getSessionDetail = vi.fn().mockResolvedValue(mockDetail);
const getDoctorDashboard = vi.fn().mockResolvedValue({ sessions: [] });
const startConsultation = vi.fn().mockResolvedValue({ consultationId: 'c1', status: 'IN_PROGRESS', startedAt: new Date().toISOString() });
const completeConsultation = vi.fn().mockResolvedValue({ consultationId: 'c1', status: 'COMPLETED', completedAt: new Date().toISOString() });
const connectWs = vi.fn().mockReturnValue(() => {});

vi.mock('@medikiosk/api-client', () => ({
  getSessionDetail: (...args: unknown[]) => getSessionDetail(...args),
  getDoctorDashboard: (...args: unknown[]) => getDoctorDashboard(...args),
  startConsultation: (...args: unknown[]) => startConsultation(...args),
  completeConsultation: (...args: unknown[]) => completeConsultation(...args),
  connectWs: (...args: unknown[]) => connectWs(...args),
  ApiClientError: class ApiClientError extends Error {
    status = 500;
  },
}));

vi.mock('../lib/authStore.js', () => ({
  getDoctorName: () => 'Dr. Rohan Mehta',
  clearSession: vi.fn(),
}));

const { ConsultationScreen } = await import('./ConsultationScreen.js');

describe('ConsultationScreen', () => {
  it('renders patient quick brief, telemetry, allergy warnings, and consultation writer', async () => {
    render(
      <ConsultationScreen
        sessionId="s1"
        onBack={vi.fn()}
        onOpenPatient360={vi.fn()}
        onLoggedOut={vi.fn()}
      />
    );

    expect(await screen.findByText('Rajesh Sharma')).toBeInTheDocument();
    expect(screen.getByText('Severe Angina with Breathlessness')).toBeInTheDocument();
    expect(screen.getByText(/ALLERGY WARNING/i)).toBeInTheDocument();
    expect(screen.getByText(/Intake Vitals/i)).toBeInTheDocument();
    expect(screen.getByText('Active Doctor Consultation')).toBeInTheDocument();
  });

  it('triggers navigation back to OPD queue and to full Patient 360', async () => {
    const onBack = vi.fn();
    const onOpenPatient360 = vi.fn();

    render(
      <ConsultationScreen
        sessionId="s1"
        onBack={onBack}
        onOpenPatient360={onOpenPatient360}
        onLoggedOut={vi.fn()}
      />
    );

    await screen.findByText('Rajesh Sharma');

    const backBtn = screen.getByRole('button', { name: /back to opd queue/i });
    await userEvent.click(backBtn);
    expect(onBack).toHaveBeenCalled();

    const patient360Btn = screen.getByRole('button', { name: /open full patient 360/i });
    await userEvent.click(patient360Btn);
    expect(onOpenPatient360).toHaveBeenCalled();
  });
});
