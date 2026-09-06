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
  it('loads and displays a patient session row with its alert severity', async () => {
    render(<DashboardScreen onLoggedOut={vi.fn()} />);
    expect(await screen.findByText('Demo Patient 001')).toBeInTheDocument();
    expect(screen.getByText('Chest pain')).toBeInTheDocument();
    expect(screen.getByText(/HIGH/)).toBeInTheDocument();
  });
});
