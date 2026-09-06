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
    drugAllergies: [],
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
};

const getSessionDetail = vi.fn().mockResolvedValue(baseDetail);
const acknowledgeAlert = vi.fn().mockResolvedValue({ alertId: 'a1', acknowledged: true, acknowledgedAt: new Date().toISOString() });
const connectWs = vi.fn().mockReturnValue(() => {});

vi.mock('@medikiosk/api-client', () => ({
  getSessionDetail: (...args: unknown[]) => getSessionDetail(...args),
  acknowledgeAlert: (...args: unknown[]) => acknowledgeAlert(...args),
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
  it('shows the structured history and an unacknowledged red flag', async () => {
    render(<SessionDetailScreen sessionId="s1" onBack={vi.fn()} onLoggedOut={vi.fn()} />);
    expect(await screen.findByText('Demo Patient 001')).toBeInTheDocument();
    expect(screen.getByText('Chest pain')).toBeInTheDocument();
    expect(screen.getByText('Potential emergency symptoms detected.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /acknowledge/i })).toBeInTheDocument();
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
});
