import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const simulateRfidScan = vi.fn().mockResolvedValue({ sessionId: 's1', patientId: 'p1' });

vi.mock('@medikiosk/api-client', () => ({
  simulateRfidScan: (...args: unknown[]) => simulateRfidScan(...args),
  ApiClientError: class ApiClientError extends Error {},
}));

const { IdentifyScreen } = await import('./IdentifyScreen.js');

describe('IdentifyScreen', () => {
  it('shows the tap-card prompt and both demo simulate buttons', () => {
    render(<IdentifyScreen wsState="open" error={null} onError={vi.fn()} />);
    expect(screen.getByText(/Tap your patient card/)).toBeInTheDocument();
    expect(screen.getByText('Waiting for card…')).toBeInTheDocument();
    expect(screen.getByText(/Demo Patient 001/)).toBeInTheDocument();
    expect(screen.getByText(/Demo Patient 002/)).toBeInTheDocument();
  });

  it('calls simulateRfidScan with the correct UID when a demo button is clicked', async () => {
    render(<IdentifyScreen wsState="open" error={null} onError={vi.fn()} />);
    await userEvent.click(screen.getByText(/Demo Patient 001/));
    expect(simulateRfidScan).toHaveBeenCalledWith({ uid: 'DEMO-RFID-001' });
  });

  it('shows an error message when provided', () => {
    render(<IdentifyScreen wsState="open" error="Card not recognized." onError={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Card not recognized.');
  });
});
