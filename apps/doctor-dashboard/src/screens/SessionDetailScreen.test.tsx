import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const baseDetail = {
  sessionId: 's1',
  status: 'ROUTED',
  mode: 'GENERAL',
  language: 'EN',
  isDemo: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  patient: { id: 'p1', fullName: 'Demo Patient 001', dateOfBirth: null, gender: 'Male', phone: null },
  consent: { status: 'GRANTED', language: 'EN', grantedAt: new Date().toISOString() },
  history: {
    id: 'h1',
    sessionId: 's1',
    patientId: 'p1',
    mode: 'GENERAL',
    chiefComplaint: 'Chest pain',
    hpi: [{ label: 'Onset', value: 'A few hours ago' }],
    pastMedicalHistory: [],
    pastSurgicalHistory: [],
    currentMedications: [],
    drugAllergies: [{ label: 'Penicillin', value: 'Urticaria rash' }],
    familyHistory: [],
    personalHistory: [],
    reviewOfSystems: [],
    previousInvestigations: [],
    ayushFields: null,
    completedAt: new Date().toISOString(),
  },
  alerts: [
    {
      id: 'a1',
      sessionId: 's1',
      patientId: 'p1',
      severity: 'HIGH',
      triggerType: 'OPTION_FLAGGED',
      message: 'Potential emergency symptoms detected.',
      triggeredByAnswerId: 'ans1',
      acknowledged: false,
      acknowledgedByDoctorId: null,
      acknowledgedAt: null,
      createdAt: new Date().toISOString(),
    },
  ],
  documents: [],
  consultation: null,
  summary: {
    id: 'sum1',
    sessionId: 's1',
    patientId: 'p1',
    content: 'Patient presented with acute chest tightness. Intake verified.',
    generatorType: 'LLM',
    status: 'DRAFT',
    editedContent: null,
    confirmedByDoctorId: null,
    confirmedAt: null,
    createdAt: new Date().toISOString(),
  },
};

const getSessionDetail = vi.fn().mockResolvedValue(baseDetail);
const acknowledgeAlert = vi.fn().mockResolvedValue({ alertId: 'a1', acknowledged: true, acknowledgedAt: new Date().toISOString() });
const startConsultation = vi.fn().mockResolvedValue({ consultationId: 'c1', status: 'IN_PROGRESS', startedAt: new Date().toISOString() });
const completeConsultation = vi.fn().mockResolvedValue({ consultationId: 'c1', status: 'COMPLETED', completedAt: new Date().toISOString() });
const reviewAISummary = vi.fn().mockResolvedValue({ summaryId: 'sum1', status: 'CONFIRMED', content: 'Verified' });
const askCopilotChat = vi.fn().mockResolvedValue({ reply: 'Patient reported symptoms', sources: [] });
const connectWs = vi.fn().mockReturnValue(() => {});

vi.mock('@medikiosk/api-client', () => ({
  getSessionDetail: (...args: unknown[]) => getSessionDetail(...args),
  acknowledgeAlert: (...args: unknown[]) => acknowledgeAlert(...args),
  startConsultation: (...args: unknown[]) => startConsultation(...args),
  completeConsultation: (...args: unknown[]) => completeConsultation(...args),
  reviewAISummary: (...args: unknown[]) => reviewAISummary(...args),
  askCopilotChat: (...args: unknown[]) => askCopilotChat(...args),
  connectWs: (...args: unknown[]) => connectWs(...args),
  ApiClientError: class ApiClientError extends Error {
    status = 500;
  },
}));

vi.mock('../lib/authStore.js', () => ({
  getDoctorName: () => 'Dr. Demo',
  clearSession: vi.fn(),
}));

const { SessionDetailScreen } = await import('./SessionDetailScreen.js');

describe('SessionDetailScreen', () => {
  it('shows the structured history, drug allergy banner, and an unacknowledged red flag', async () => {
    render(<SessionDetailScreen sessionId="s1" onBack={vi.fn()} onLoggedOut={vi.fn()} />);
    expect(await screen.findByText('Demo Patient 001')).toBeInTheDocument();
    expect(screen.getByText('Chest pain')).toBeInTheDocument();
    expect(screen.getByText('Potential emergency symptoms detected.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /acknowledge/i })).toBeInTheDocument();
    expect(screen.getByText(/Known Drug Allergies Flagged:/i)).toBeInTheDocument();
  });

  it('acknowledges the alert and refreshes', async () => {
    render(<SessionDetailScreen sessionId="s1" onBack={vi.fn()} onLoggedOut={vi.fn()} />);
    await screen.findByText('Demo Patient 001');

    getSessionDetail.mockResolvedValueOnce({
      ...baseDetail,
      alerts: [{ ...baseDetail.alerts[0], acknowledged: true, acknowledgedByDoctorId: 'doc1', acknowledgedAt: new Date().toISOString() }],
    });

    await userEvent.click(screen.getByRole('button', { name: /acknowledge/i }));
    expect(acknowledgeAlert).toHaveBeenCalledWith('a1');
  });

  it('switches between tabs including Documents & OCR, Timeline, and Consultation', async () => {
    render(<SessionDetailScreen sessionId="s1" onBack={vi.fn()} onLoggedOut={vi.fn()} />);
    await screen.findByText('Demo Patient 001');

    // Click Documents & OCR tab
    const docsTab = screen.getByRole('button', { name: /documents & ocr inspector/i });
    await userEvent.click(docsTab);
    expect(screen.getByText('Medical Records & AI Document OCR')).toBeInTheDocument();

    // Click Timeline tab
    const timelineTab = screen.getByRole('button', { name: /longitudinal timeline/i });
    await userEvent.click(timelineTab);
    expect(screen.getByText('Longitudinal Medical Timeline')).toBeInTheDocument();

    // Click Consultation tab
    const consultTab = screen.getByRole('button', { name: /active consultation & rx/i });
    await userEvent.click(consultTab);
    expect(screen.getByText('Active Doctor Consultation')).toBeInTheDocument();
  });

  it('handles AI summary accept action', async () => {
    render(<SessionDetailScreen sessionId="s1" onBack={vi.fn()} onLoggedOut={vi.fn()} />);
    await screen.findByText('Demo Patient 001');

    const acceptBtn = screen.getByRole('button', { name: /accept & save/i });
    await userEvent.click(acceptBtn);
    expect(reviewAISummary).toHaveBeenCalledWith('s1', { action: 'ACCEPT' });
  });
});
