import { useState, type FormEvent } from 'react';
import { Stethoscope } from 'lucide-react';
import { ApiClientError, login } from '@medikiosk/api-client';
import { setSession } from '../lib/authStore.js';

export interface LoginScreenProps {
  onLoggedIn: () => void;
}

export function LoginScreen({ onLoggedIn }: LoginScreenProps) {
  const [email, setEmail] = useState('demo.doctor@medikiosk.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await login({ email, password });
      setSession(result.token, result.name);
      onLoggedIn();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-700 text-white">
            <Stethoscope size={22} />
          </span>
          <h1 className="text-xl font-bold text-neutral-900">MediKiosk</h1>
          <p className="text-sm text-neutral-400">Clinical Intake Dashboard</p>
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-800">
            {error}
          </div>
        )}

        <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
        />

        <label htmlFor="password" className="mb-1 block text-sm font-medium text-neutral-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:opacity-50"
        >
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>

        <p className="mt-4 text-center text-xs text-neutral-400">Demo: demo.doctor@medikiosk.local / MediKiosk@123</p>
      </form>
    </div>
  );
}
