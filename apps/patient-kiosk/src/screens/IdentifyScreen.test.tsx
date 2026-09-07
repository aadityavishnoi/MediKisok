import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const simulateRfidScan = vi.fn().mockResolvedValue({ sessionId: 's1', patientId: 'p1' });

vi.mock('@medikiosk/api-client', () => ({
  simulateRfidScan: (...args: unknown[]) => simulateRfidScan(...args),
  sendOtp: vi.fn().mockResolvedValue({ devOtp: '123456', expiresInSeconds: 300 }),
  verifyOtp: vi.fn().mockResolvedValue({ verified: true }),
  registerKioskPatient: vi.fn().mockResolvedValue({
    patient: { fullName: 'Test Patient' },
    sessionId: 'session-123',
  }),
  ApiClientError: class ApiClientError extends Error {},
}));

const { IdentifyScreen } = await import('./IdentifyScreen.js');

describe('IdentifyScreen', () => {
  it('shows the tap-card prompt and physical RFID hardware scanner active status', () => {
    render(<IdentifyScreen wsState="open" error={null} onError={vi.fn()} />);
    expect(screen.getAllByText(/Tap Card/).length).toBeGreaterThan(0);
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText(/Physical RFID Hardware Scanner Active/)).toBeInTheDocument();
    expect(screen.getByText(/Live Reader/)).toBeInTheDocument();
  });

  it('switches to registration mode and pre-fills card UID when a blank card is detected', () => {
    render(<IdentifyScreen wsState="open" error={null} onError={vi.fn()} detectedCardUid="82:12:68:E9" />);
    expect(screen.getByText(/Blank.*\(82:12:68:E9\)/)).toBeInTheDocument();
    expect(screen.getByDisplayValue('82:12:68:E9')).toBeInTheDocument();
  });

  it('shows an error message when provided', () => {
    render(<IdentifyScreen wsState="open" error="Card not recognized." onError={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Card not recognized.');
  });

  it('reflects the real WebSocket state rather than always claiming to be connected', () => {
    const { rerender } = render(<IdentifyScreen wsState="connecting" error={null} onError={vi.fn()} />);
    expect(screen.getByText('Connecting…')).toBeInTheDocument();

    rerender(<IdentifyScreen wsState="closed" error={null} onError={vi.fn()} />);
    expect(screen.getByText('Reconnecting…')).toBeInTheDocument();
  });
});
