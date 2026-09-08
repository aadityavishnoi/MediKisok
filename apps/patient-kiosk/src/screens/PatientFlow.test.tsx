import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { PatientFlow } from './PatientFlow.js';

const mockGetNextClinicalQuestion = vi.fn();
const mockSubmitConsent = vi.fn().mockResolvedValue({ status: 'GRANTED' });

vi.mock('@medikiosk/api-client', () => ({
  submitConsent: (...args: unknown[]) => mockSubmitConsent(...args),
  getNextClinicalQuestion: (...args: unknown[]) => mockGetNextClinicalQuestion(...args),
  ApiClientError: class ApiClientError extends Error {
    constructor(
      public status: number,
      public code: string,
      message: string,
    ) {
      super(message);
    }
  },
}));

describe('PatientFlow End-to-End Intake Cycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('completes the full flow: Language -> Consent -> Symptom -> Dynamic Questioning -> Completion', async () => {
    // 1st question: Fever chronometry
    mockGetNextClinicalQuestion.mockResolvedValueOnce({
      nextQuestion: {
        id: 'FEV_001',
        text: 'How many days have you had the fever?',
        priority: 'MEDIUM',
      },
      reason: 'fever_chronometry',
      safetyFlags: [],
      requiresDoctorReview: true,
    });

    // 2nd response: No more candidate questions (completion)
    mockGetNextClinicalQuestion.mockResolvedValueOnce({
      nextQuestion: null,
      reason: 'no_more_candidate_questions',
      safetyFlags: [],
      requiresDoctorReview: true,
    });

    render(<PatientFlow sessionId="session_e2e_001" wsState="open" />);

    // 1. Language Screen
    const englishBtn = screen.getByRole('button', { name: /English/i });
    fireEvent.click(englishBtn);

    // 2. Consent Screen
    const agreeBtn = await screen.findByRole('button', { name: /I Agree/i });
    fireEvent.click(agreeBtn);

    // 3. Chief Complaint Screen
    const feverBtn = await screen.findByRole('button', { name: /Fever/i });
    fireEvent.click(feverBtn);

    // 4. Dynamic Question Screen
    expect(await screen.findByText('How many days have you had the fever?')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM Priority')).toBeInTheDocument();

    // 5. Patient answers the question
    const yesBtn = screen.getByRole('button', { name: /^Yes$/i });
    fireEvent.click(yesBtn);

    // 6. Dynamic Questioning Completion Screen
    expect(await screen.findByText('Initial Intake Questions Complete')).toBeInTheDocument();
    expect(screen.getByText(/Awaiting Doctor Review/i)).toBeInTheDocument();
    expect(screen.getByText(/NOT a definitive medical diagnosis/i)).toBeInTheDocument();

    // 7. Proceed to Document Upload / Scan
    const proceedBtn = screen.getByRole('button', { name: /Proceed to Document Upload/i });
    fireEvent.click(proceedBtn);

    // 8. Document Upload Screen renders
    expect(await screen.findByText(/Scan Prescription or Reports/i)).toBeInTheDocument();
  });
});
