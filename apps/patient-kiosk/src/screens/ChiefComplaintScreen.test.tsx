import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChiefComplaintScreen } from './ChiefComplaintScreen.js';

describe('ChiefComplaintScreen', () => {
  it('renders all six chief complaint categories and reports the chosen one', async () => {
    const onSelect = vi.fn();
    render(<ChiefComplaintScreen language="EN" onSelect={onSelect} />);

    expect(screen.getByText(/Chest pain/)).toBeInTheDocument();
    expect(screen.getByText(/Breathing difficulty/)).toBeInTheDocument();
    expect(screen.getByText(/Something else/)).toBeInTheDocument();

    await userEvent.click(screen.getByText(/Chest pain/));
    expect(onSelect).toHaveBeenCalledWith('chest-pain');
  });

  it('renders Hindi labels when language is HI', () => {
    render(<ChiefComplaintScreen language="HI" onSelect={vi.fn()} />);
    expect(screen.getByText('सीने में दर्द')).toBeInTheDocument();
  });
});
