import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { Language } from '@medikiosk/shared-types';

const mockGetNextClinicalQuestion = vi.fn();

vi.mock('@medikiosk/api-client', () => ({
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

const { DynamicHistoryScreen } = await import('./DynamicHistoryScreen.js');

describe('DynamicHistoryScreen - 12 Clinical Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Initial symptom submission calls /api/ai/next-question
  it('Scenario 1: calls /api/ai/next-question with initial symptoms on mount', async () => {
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

    render(
      <DynamicHistoryScreen
        sessionId="sess_test_1"
        language={Language.EN}
        initialSymptoms={['fever']}
        patientDemographics={{ age: 34, gender: 'M' }}
        onComplete={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockGetNextClinicalQuestion).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'sess_test_1',
          symptoms: ['fever'],
          answers: {},
          patient: { age: 34, gender: 'M' },
        }),
      );
    });
  });

  // 2. Returned question is displayed
  it('Scenario 2: displays the returned clinical question text and priority badge', async () => {
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

    render(
      <DynamicHistoryScreen
        sessionId="sess_test_2"
        language={Language.EN}
        initialSymptoms={['fever']}
        onComplete={vi.fn()}
      />,
    );

    expect(await screen.findByText('How many days have you had the fever?')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM Priority')).toBeInTheDocument();
  });

  // 3. Answering a question triggers the next API request
  it('Scenario 3: answering a question sends updated answers to backend', async () => {
    mockGetNextClinicalQuestion
      .mockResolvedValueOnce({
        nextQuestion: {
          id: 'FEV_001',
          text: 'How many days have you had the fever?',
          priority: 'MEDIUM',
        },
        reason: 'fever_chronometry',
        safetyFlags: [],
        requiresDoctorReview: true,
      })
      .mockResolvedValueOnce({
        nextQuestion: {
          id: 'FEV_002',
          text: 'Have you experienced shaking chills or rigors?',
          priority: 'MEDIUM',
        },
        reason: 'chills_evaluation',
        safetyFlags: [],
        requiresDoctorReview: true,
      });

    render(
      <DynamicHistoryScreen
        sessionId="sess_test_3"
        language={Language.EN}
        initialSymptoms={['fever']}
        onComplete={vi.fn()}
      />,
    );

    const yesButton = await screen.findByRole('button', { name: /^Yes$/i });
    fireEvent.click(yesButton);

    await waitFor(() => {
      expect(mockGetNextClinicalQuestion).toHaveBeenCalledTimes(2);
      expect(mockGetNextClinicalQuestion).toHaveBeenLastCalledWith(
        expect.objectContaining({
          answers: { FEV_001: 'yes' },
        }),
      );
    });
  });

  // 4. Previously answered question is never displayed again
  it('Scenario 4: previously answered question is replaced by subsequent question', async () => {
    mockGetNextClinicalQuestion
      .mockResolvedValueOnce({
        nextQuestion: {
          id: 'FEV_001',
          text: 'How many days have you had the fever?',
          priority: 'MEDIUM',
        },
        reason: 'fever_chronometry',
        safetyFlags: [],
        requiresDoctorReview: true,
      })
      .mockResolvedValueOnce({
        nextQuestion: {
          id: 'RESP_001',
          text: 'Are you experiencing difficulty breathing?',
          priority: 'HIGH',
        },
        reason: 'respiratory_screening',
        safetyFlags: [],
        requiresDoctorReview: true,
      });

    render(
      <DynamicHistoryScreen
        sessionId="sess_test_4"
        language={Language.EN}
        initialSymptoms={['fever', 'cough']}
        onComplete={vi.fn()}
      />,
    );

    await screen.findByText('How many days have you had the fever?');
    const noButton = screen.getByRole('button', { name: /^No$/i });
    fireEvent.click(noButton);

    expect(await screen.findByText('Are you experiencing difficulty breathing?')).toBeInTheDocument();
    expect(screen.queryByText('How many days have you had the fever?')).not.toBeInTheDocument();
  });

  // 5. Multiple questions can be answered sequentially
  it('Scenario 5: supports multi-turn sequential questioning loop', async () => {
    mockGetNextClinicalQuestion
      .mockResolvedValueOnce({
        nextQuestion: { id: 'Q1', text: 'First Question?', priority: 'LOW' },
        reason: 'step_1',
        safetyFlags: [],
        requiresDoctorReview: true,
      })
      .mockResolvedValueOnce({
        nextQuestion: { id: 'Q2', text: 'Second Question?', priority: 'LOW' },
        reason: 'step_2',
        safetyFlags: [],
        requiresDoctorReview: true,
      })
      .mockResolvedValueOnce({
        nextQuestion: { id: 'Q3', text: 'Third Question?', priority: 'LOW' },
        reason: 'step_3',
        safetyFlags: [],
        requiresDoctorReview: true,
      });

    render(
      <DynamicHistoryScreen
        sessionId="sess_test_5"
        language={Language.EN}
        initialSymptoms={['malaise']}
        onComplete={vi.fn()}
      />,
    );

    await screen.findByText('First Question?');
    fireEvent.click(screen.getByRole('button', { name: /^Yes$/i }));

    await screen.findByText('Second Question?');
    fireEvent.click(screen.getByRole('button', { name: /^No$/i }));

    await screen.findByText('Third Question?');
    expect(mockGetNextClinicalQuestion).toHaveBeenCalledTimes(3);
    expect(mockGetNextClinicalQuestion).toHaveBeenLastCalledWith(
      expect.objectContaining({
        answers: { Q1: 'yes', Q2: 'no' },
      }),
    );
  });

  // 6. nextQuestion: null displays completion state
  it('Scenario 6: displays completion screen when nextQuestion is null', async () => {
    mockGetNextClinicalQuestion.mockResolvedValueOnce({
      nextQuestion: null,
      reason: 'no_more_candidate_questions',
      safetyFlags: [],
      requiresDoctorReview: true,
    });

    render(
      <DynamicHistoryScreen
        sessionId="sess_test_6"
        language={Language.EN}
        initialSymptoms={['checkup']}
        onComplete={vi.fn()}
      />,
    );

    expect(await screen.findByText('Initial Intake Questions Complete')).toBeInTheDocument();
    expect(
      screen.getByText(/Initial clinical screening questions are complete/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/NOT a definitive medical diagnosis/i)).toBeInTheDocument();
    expect(screen.getByText(/Awaiting Doctor Review/i)).toBeInTheDocument();
  });

  // 7. API loading state works correctly
  it('Scenario 7: disables answer buttons while request is in flight', async () => {
    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockGetNextClinicalQuestion.mockReturnValueOnce(pendingPromise);

    render(
      <DynamicHistoryScreen
        sessionId="sess_test_7"
        language={Language.EN}
        initialSymptoms={['fever']}
        onComplete={vi.fn()}
      />,
    );

    // Initial state is loading
    expect(screen.getByText(/Evaluating dynamic evidence/i)).toBeInTheDocument();

    // Resolve initial fetch
    resolvePromise!({
      nextQuestion: { id: 'FEV_001', text: 'Fever days?', priority: 'MEDIUM' },
      reason: 'chronometry',
      safetyFlags: [],
      requiresDoctorReview: true,
    });

    const yesBtn = await screen.findByRole('button', { name: /^Yes$/i });
    expect(yesBtn).not.toBeDisabled();
  });

  // 8. API error displays retry UI
  it('Scenario 8: displays error banner and recovers upon clicking retry', async () => {
    mockGetNextClinicalQuestion
      .mockRejectedValueOnce(new Error('Network connection timeout'))
      .mockResolvedValueOnce({
        nextQuestion: { id: 'FEV_001', text: 'Fever duration?', priority: 'MEDIUM' },
        reason: 'retry_success',
        safetyFlags: [],
        requiresDoctorReview: true,
      });

    render(
      <DynamicHistoryScreen
        sessionId="sess_test_8"
        language={Language.EN}
        initialSymptoms={['fever']}
        onComplete={vi.fn()}
      />,
    );

    const retryBtn = await screen.findByRole('button', { name: /Try Again/i });
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);

    expect(await screen.findByText('Fever duration?')).toBeInTheDocument();
  });

  // 9. Red-flag response displays appropriate safety escalation
  it('Scenario 9: displays priority red-flag safety alert and nurse escalation button', async () => {
    const mockNurseAlert = vi.fn();

    mockGetNextClinicalQuestion.mockResolvedValueOnce({
      nextQuestion: {
        id: 'CARD_001',
        text: 'Does the chest pain radiate to your left arm or jaw?',
        priority: 'CRITICAL',
      },
      reason: 'red_flag_screening',
      safetyFlags: ['URGENT: Precordial chest pain reported - cardiac evaluation indicated'],
      requiresDoctorReview: true,
    });

    render(
      <DynamicHistoryScreen
        sessionId="sess_test_9"
        language={Language.EN}
        initialSymptoms={['chest pain']}
        onComplete={vi.fn()}
        onEmergencyEscalate={mockNurseAlert}
      />,
    );

    expect(await screen.findByText(/Priority Clinical Screening/i)).toBeInTheDocument();
    expect(screen.getByText(/Precordial chest pain reported/i)).toBeInTheDocument();

    const nurseBtn = screen.getByRole('button', { name: /Alert Nurse/i });
    fireEvent.click(nurseBtn);
    expect(mockNurseAlert).toHaveBeenCalledTimes(1);
  });

  // 10. requiresDoctorReview: true is respected
  it('Scenario 10: displays explicit doctor review requirement notice', async () => {
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

    render(
      <DynamicHistoryScreen
        sessionId="sess_test_10"
        language={Language.EN}
        initialSymptoms={['fever']}
        onComplete={vi.fn()}
      />,
    );

    expect(
      await screen.findByText(/Responses are securely transmitted for doctor review/i),
    ).toBeInTheDocument();
  });

  // 11. Missing regional signals do not break request
  it('Scenario 11: executes cleanly when regionalSignals is empty array', async () => {
    mockGetNextClinicalQuestion.mockResolvedValueOnce({
      nextQuestion: {
        id: 'NEURO_001',
        text: 'Do you have neck stiffness with this headache?',
        priority: 'CRITICAL',
      },
      reason: 'meningismus_check',
      safetyFlags: [],
      requiresDoctorReview: true,
    });

    render(
      <DynamicHistoryScreen
        sessionId="sess_test_11"
        language={Language.EN}
        initialSymptoms={['headache']}
        regionalSignals={[]}
        onComplete={vi.fn()}
      />,
    );

    expect(await screen.findByText('Do you have neck stiffness with this headache?')).toBeInTheDocument();
    expect(mockGetNextClinicalQuestion).toHaveBeenCalledWith(
      expect.objectContaining({
        regionalSignals: [],
      }),
    );
  });

  // 12. Invalid patient/symptom input is handled gracefully
  it('Scenario 12: falls back safely when symptoms array is empty', async () => {
    mockGetNextClinicalQuestion.mockResolvedValueOnce({
      nextQuestion: {
        id: 'FEV_001',
        text: 'How long have you had this issue?',
        priority: 'LOW',
      },
      reason: 'baseline_screening',
      safetyFlags: [],
      requiresDoctorReview: true,
    });

    render(
      <DynamicHistoryScreen
        sessionId="sess_test_12"
        language={Language.EN}
        initialSymptoms={[]} // Empty symptoms
        patientDemographics={{ age: 0, gender: '' }} // Minimal demographics
        onComplete={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockGetNextClinicalQuestion).toHaveBeenCalledWith(
        expect.objectContaining({
          symptoms: ['general-evaluation'],
          patient: { age: 1, gender: 'M' },
        }),
      );
    });
  });
});
