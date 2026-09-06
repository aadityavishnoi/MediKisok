import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const login = vi.fn().mockResolvedValue({ token: 'tok', role: 'DOCTOR', name: 'Dr. Demo' });

vi.mock('@medikiosk/api-client', () => ({
  login: (...args: unknown[]) => login(...args),
  ApiClientError: class ApiClientError extends Error {},
}));

vi.mock('../lib/authStore.js', () => ({
  setSession: vi.fn(),
}));

const { LoginScreen } = await import('./LoginScreen.js');

describe('LoginScreen', () => {
  it('submits credentials and calls onLoggedIn on success', async () => {
    const onLoggedIn = vi.fn();
    render(<LoginScreen onLoggedIn={onLoggedIn} />);

    await userEvent.type(screen.getByLabelText('Password'), 'MediKiosk@123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(login).toHaveBeenCalledWith({ email: 'demo.doctor@medikiosk.local', password: 'MediKiosk@123' });
    expect(onLoggedIn).toHaveBeenCalled();
  });

  it('shows an error message when login fails', async () => {
    login.mockRejectedValueOnce(new Error('Invalid email or password'));
    render(<LoginScreen onLoggedIn={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
