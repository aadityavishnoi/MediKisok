import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentOcrViewer } from './DocumentOcrViewer.js';

describe('DocumentOcrViewer', () => {
  it('renders document scans and extracted clinical entities with confidence', () => {
    render(<DocumentOcrViewer patientName="Rajesh Kumar" />);

    expect(screen.getByText('Medical Records & AI Document OCR')).toBeInTheDocument();
    expect(screen.getByText('Document Scan Preview')).toBeInTheDocument();
    expect(screen.getByText('Zero Hallucination Guarantee')).toBeInTheDocument();
    expect(screen.getByText('Metoprolol Succinate 50mg (OD Morning)')).toBeInTheDocument();
  });

  it('allows physician to toggle verification status of extracted entities', async () => {
    render(<DocumentOcrViewer patientName="Rajesh Kumar" />);

    const verifyButtons = screen.getAllByRole('button', { name: /verify/i });
    expect(verifyButtons.length).toBeGreaterThan(0);

    await userEvent.click(verifyButtons[0]);
    expect(screen.getAllByText(/verified/i).length).toBeGreaterThan(0);
  });
});
