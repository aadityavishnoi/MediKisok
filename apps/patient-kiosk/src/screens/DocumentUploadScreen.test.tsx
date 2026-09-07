import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Language } from '@medikiosk/shared-types';
import { DocumentUploadScreen } from './DocumentUploadScreen.js';

describe('DocumentUploadScreen', () => {
  it('renders document scanner options and skip button', () => {
    render(<DocumentUploadScreen language={Language.EN} onComplete={vi.fn()} onSkip={vi.fn()} />);

    expect(screen.getByText(/Scan Prescription or Reports/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /📄 Prescription/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /🧪 Lab Report/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /🆔 ABHA \/ ID Card/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Skip/i })).toBeInTheDocument();
  });

  it('triggers document scan and shows verified extracted result', async () => {
    const onComplete = vi.fn();

    vi.spyOn(global, 'fetch').mockImplementation(async (url: any) => {
      if (String(url).includes('/api/documents/scan')) {
        return {
          ok: true,
          json: async () => ({
            documentId: 'doc_test_123',
            documentType: 'PRESCRIPTION',
            summary: 'Prescription scanned: Tab. Paracetamol 500mg BD',
            confidence: 95,
            fields: [
              { fieldType: 'MEDICATION', fieldValue: 'Tab. Paracetamol 500mg BD', confidence: 0.95 },
            ],
            engineUsed: 'GEMINI_VISION',
          }),
        } as Response;
      }
      return { ok: false } as Response;
    });

    render(<DocumentUploadScreen language={Language.EN} onComplete={onComplete} onSkip={vi.fn()} />);

    const scanBtn = screen.getByRole('button', { name: /Capture & Scan|Simulate Document Capture/i });
    await userEvent.click(scanBtn);

    // Wait for OCR result to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Verified/i)).toBeInTheDocument();
    }, { timeout: 4000 });

    const paracetamolMatches = screen.getAllByText(/Paracetamol/i);
    expect(paracetamolMatches.length).toBeGreaterThan(0);

    // Click Complete Intake
    const completeBtn = screen.getByRole('button', { name: /Complete Intake/i });
    await userEvent.click(completeBtn);
    expect(onComplete).toHaveBeenCalled();
  });

  it('calls onSkip when user chooses to skip scanner', async () => {
    const onSkip = vi.fn();
    render(<DocumentUploadScreen language={Language.EN} onComplete={vi.fn()} onSkip={onSkip} />);

    await userEvent.click(screen.getByRole('button', { name: /Skip/i }));
    expect(onSkip).toHaveBeenCalled();
  });
});
