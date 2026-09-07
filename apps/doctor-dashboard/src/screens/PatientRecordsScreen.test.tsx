import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockDashboard = {
  sessions: [
    {
      sessionId: 'sess-rec-1',
      patient: { id: 'p1', fullName: 'Sunita Patel', dateOfBirth: '1982-08-05T00:00:00.000Z', gender: 'Female' },
      status: 'COMPLETED',
      chiefComplaint: 'Palpitations & lipid profile review',
      highestAlertSeverity: null,
      updatedAt: new Date().toISOString(),
    },
    {
      sessionId: 'sess-rec-2',
      patient: { id: 'p2', fullName: 'Rajesh Kumar', dateOfBirth: '1974-05-12T00:00:00.000Z', gender: 'Male' },
      status: 'ROUTED',
      chiefComplaint: 'Acute chest tightness',
      highestAlertSeverity: 'HIGH',
      updatedAt: new Date().toISOString(),
    },
  ],
};

const getDoctorDashboard = vi.fn().mockResolvedValue(mockDashboard);
const connectWs = vi.fn().mockReturnValue(() => {});

vi.mock('@medikiosk/api-client', () => ({
  getDoctorDashboard: () => getDoctorDashboard(),
  connectWs: (...args: unknown[]) => connectWs(...args),
  ApiClientError: class ApiClientError extends Error {
    status = 500;
  },
}));

vi.mock('../lib/authStore.js', () => ({
  getDoctorName: () => 'Dr. Rohan Mehta',
  clearSession: vi.fn(),
}));

const { PatientRecordsScreen } = await import('./PatientRecordsScreen.js');

describe('PatientRecordsScreen', () => {
  it('renders records repository header, patient records table, and status filters', async () => {
    render(
      <PatientRecordsScreen
        onBack={vi.fn()}
        onOpenSession={vi.fn()}
        onOpenConsultation={vi.fn()}
        onOpenAlerts={vi.fn()}
        onLoggedOut={vi.fn()}
      />
    );

    expect(await screen.findByText('Patient Records Repository')).toBeInTheDocument();
    expect(screen.getByText('Sunita Patel')).toBeInTheDocument();
    expect(screen.getByText('Palpitations & lipid profile review')).toBeInTheDocument();
    expect(screen.getByText('View Rx')).toBeInTheDocument();
  });

  it('navigates to session detail and consultation from records table', async () => {
    const onOpenSession = vi.fn();
    const onOpenConsultation = vi.fn();
    const onBack = vi.fn();

    render(
      <PatientRecordsScreen
        onBack={onBack}
        onOpenSession={onOpenSession}
        onOpenConsultation={onOpenConsultation}
        onOpenAlerts={vi.fn()}
        onLoggedOut={vi.fn()}
      />
    );

    await screen.findByText('Sunita Patel');

    // Click Open 360
    const open360Btns = screen.getAllByRole('button', { name: /open 360/i });
    await userEvent.click(open360Btns[0]);
    expect(onOpenSession).toHaveBeenCalledWith('sess-rec-1');

    // Click View Rx / Consult
    const viewRxBtn = screen.getByRole('button', { name: /view rx/i });
    await userEvent.click(viewRxBtn);
    expect(onOpenConsultation).toHaveBeenCalledWith('sess-rec-1');

    // Click Back to OPD queue
    const backBtn = screen.getByRole('button', { name: /back to opd queue/i });
    await userEvent.click(backBtn);
    expect(onBack).toHaveBeenCalled();
  });
});
