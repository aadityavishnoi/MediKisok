import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const getDoctorDashboard = vi.fn().mockResolvedValue({
  sessions: [
    {
      sessionId: 's1',
      patient: { id: 'p1', fullName: 'Demo Patient 001', dateOfBirth: null, gender: 'Male' },
      status: 'IN_HISTORY',
      chiefComplaint: 'Chest pain',
      highestAlertSeverity: 'HIGH',
      updatedAt: new Date().toISOString(),
    },
  ],
});
const connectWs = vi.fn().mockReturnValue(() => {});

vi.mock('@medikiosk/api-client', () => ({
  getDoctorDashboard: () => getDoctorDashboard(),
  connectWs: (...args: unknown[]) => connectWs(...args),
  getRfidReaderStatus: vi.fn().mockResolvedValue({
    connected: true,
    state: 'CONNECTED',
    port: 'COM3',
    baudRate: 9600,
    enabled: true,
  }),
  lookupRfidPatient: vi.fn().mockResolvedValue({
    success: true,
    patient: { id: 'p1', fullName: 'Demo Patient 001' },
    encounter: { id: 's1' },
  }),
  simulateRfidScan: vi.fn().mockResolvedValue({
    sessionId: 's1',
    patientId: 'p1',
  }),
  ApiClientError: class ApiClientError extends Error {
    status = 500;
  },
}));

vi.mock('../lib/authStore.js', () => ({
  getDoctorName: () => 'Dr. Demo',
  clearSession: vi.fn(),
}));

const { DashboardScreen } = await import('./DashboardScreen.js');

describe('DashboardScreen', () => {
  it('loads and displays a patient session row with its alert severity and live stats', async () => {
    render(<DashboardScreen onLoggedOut={vi.fn()} onOpenSession={vi.fn()} />);
    expect(await screen.findByText('Demo Patient 001')).toBeInTheDocument();
    expect(screen.getByText('Chest pain')).toBeInTheDocument();
    expect(screen.getByText('Patients Today')).toBeInTheDocument();
    expect(screen.getByText('Emergency Alerts')).toBeInTheDocument();
  });

  it('opens the session detail view when a row is clicked', async () => {
    const onOpenSession = vi.fn();
    render(<DashboardScreen onLoggedOut={vi.fn()} onOpenSession={onOpenSession} />);
    const row = await screen.findByText('Demo Patient 001');
    row.closest('tr')!.click();
    expect(onOpenSession).toHaveBeenCalledWith('s1');
  });
});
