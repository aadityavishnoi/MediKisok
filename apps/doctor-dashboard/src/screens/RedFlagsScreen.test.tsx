import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockDashboard = {
  sessions: [
    {
      sessionId: 'sess-crit-1',
      patient: { id: 'p1', fullName: 'Rajesh Kumar', dateOfBirth: '1974-05-12T00:00:00.000Z', gender: 'Male' },
      status: 'ROUTED',
      chiefComplaint: 'Acute chest tightness & shortness of breath',
      highestAlertSeverity: 'HIGH',
      updatedAt: new Date().toISOString(),
    },
    {
      sessionId: 'sess-norm-2',
      patient: { id: 'p2', fullName: 'Sunita Patel', dateOfBirth: '1982-08-05T00:00:00.000Z', gender: 'Female' },
      status: 'COMPLETED',
      chiefComplaint: 'Routine follow-up',
      highestAlertSeverity: null,
      updatedAt: new Date().toISOString(),
    },
  ],
};

const getDoctorDashboard = vi.fn().mockResolvedValue(mockDashboard);
const acknowledgeAlert = vi.fn().mockResolvedValue({ alertId: 'sess-crit-1', acknowledged: true });
const connectWs = vi.fn().mockReturnValue(() => {});

vi.mock('@medikiosk/api-client', () => ({
  getDoctorDashboard: () => getDoctorDashboard(),
  acknowledgeAlert: (...args: unknown[]) => acknowledgeAlert(...args),
  connectWs: (...args: unknown[]) => connectWs(...args),
  ApiClientError: class ApiClientError extends Error {
    status = 500;
  },
}));

vi.mock('../lib/authStore.js', () => ({
  getDoctorName: () => 'Dr. Rohan Mehta',
  clearSession: vi.fn(),
}));

const { RedFlagsScreen } = await import('./RedFlagsScreen.js');

describe('RedFlagsScreen', () => {
  it('renders emergency triage cockpit, alert cards, and triage statistics', async () => {
    render(
      <RedFlagsScreen
        onBack={vi.fn()}
        onOpenSession={vi.fn()}
        onOpenConsultation={vi.fn()}
        onOpenRecords={vi.fn()}
        onLoggedOut={vi.fn()}
      />
    );

    expect(await screen.findByText('Red Flags & Emergency Alerts')).toBeInTheDocument();
    expect(screen.getByText('Rajesh Kumar')).toBeInTheDocument();
    expect(screen.getByText(/Acute chest tightness/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /acknowledge alert/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start emergency consult/i })).toBeInTheDocument();
  });

  it('triggers acknowledge action, back to OPD queue, and emergency consult navigation', async () => {
    const onBack = vi.fn();
    const onOpenConsultation = vi.fn();

    render(
      <RedFlagsScreen
        onBack={onBack}
        onOpenSession={vi.fn()}
        onOpenConsultation={onOpenConsultation}
        onOpenRecords={vi.fn()}
        onLoggedOut={vi.fn()}
      />
    );

    await screen.findByText('Rajesh Kumar');

    // Acknowledge alert
    const ackBtn = screen.getByRole('button', { name: /acknowledge alert/i });
    await userEvent.click(ackBtn);
    expect(acknowledgeAlert).toHaveBeenCalledWith('sess-crit-1');

    // Start Emergency Consult
    const consultBtn = screen.getByRole('button', { name: /start emergency consult/i });
    await userEvent.click(consultBtn);
    expect(onOpenConsultation).toHaveBeenCalledWith('sess-crit-1');

    // Back to OPD queue
    const backBtn = screen.getByRole('button', { name: /back to opd queue/i });
    await userEvent.click(backBtn);
    expect(onBack).toHaveBeenCalled();
  });
});
