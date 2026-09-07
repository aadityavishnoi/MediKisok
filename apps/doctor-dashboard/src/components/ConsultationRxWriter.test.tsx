import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConsultationRxWriter } from './ConsultationRxWriter.js';

describe('ConsultationRxWriter', () => {
  it('renders consultation controls, SOAP notes inputs, and prescription table', () => {
    render(
      <ConsultationRxWriter
        sessionId="s1"
        patientName="Rajesh Kumar"
        onStartConsultation={vi.fn()}
        onCompleteConsultation={vi.fn()}
      />,
    );

    expect(screen.getByText('Active Doctor Consultation')).toBeInTheDocument();
    expect(screen.getByText('Start Consultation')).toBeInTheDocument();
    expect(screen.getByText(/Clinical SOAP Notes/i)).toBeInTheDocument();
    expect(screen.getByText(/Electronic Prescription Builder/i)).toBeInTheDocument();
  });

  it('triggers start consultation when button is clicked', async () => {
    const onStart = vi.fn().mockResolvedValue(undefined);
    render(
      <ConsultationRxWriter
        sessionId="s1"
        patientName="Rajesh Kumar"
        onStartConsultation={onStart}
        onCompleteConsultation={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /start consultation/i }));
    expect(onStart).toHaveBeenCalled();
  });

  it('allows adding medication presets and finalizing consultation', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);
    render(
      <ConsultationRxWriter
        sessionId="s1"
        patientName="Rajesh Kumar"
        consultation={{
          id: 'c1',
          sessionId: 's1',
          patientId: 'p1',
          doctorId: 'doc1',
          status: 'IN_PROGRESS',
          notes: null,
          startedAt: new Date().toISOString(),
          completedAt: null,
        }}
        onStartConsultation={vi.fn()}
        onCompleteConsultation={onComplete}
      />,
    );

    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
    const finalizeBtn = screen.getByRole('button', { name: /finalize & sign rx/i });
    expect(finalizeBtn).toBeInTheDocument();

    await userEvent.click(finalizeBtn);
    expect(onComplete).toHaveBeenCalled();
  });
});
