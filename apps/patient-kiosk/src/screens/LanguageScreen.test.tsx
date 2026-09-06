import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageScreen } from './LanguageScreen.js';

describe('LanguageScreen', () => {
  it('calls onSelect with EN when English is chosen', async () => {
    const onSelect = vi.fn();
    render(<LanguageScreen onSelect={onSelect} />);
    await userEvent.click(screen.getByText('English'));
    expect(onSelect).toHaveBeenCalledWith('EN');
  });

  it('calls onSelect with HI when Hindi is chosen', async () => {
    const onSelect = vi.fn();
    render(<LanguageScreen onSelect={onSelect} />);
    await userEvent.click(screen.getByText('हिन्दी'));
    expect(onSelect).toHaveBeenCalledWith('HI');
  });
});
