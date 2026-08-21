import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { login } from '../../services/authApi';

const LoginForm: React.FC<{ onSignedIn: () => void }> = ({ onSignedIn }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(password);
      setPassword('');
      onSignedIn();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      data-nav-theme="light"
      className="flex min-h-screen items-center justify-center px-6 py-32"
    >
      <form onSubmit={submit} className="surface-inset w-full max-w-md p-8">
        <p className="mono bracket mb-6 text-[var(--grey-1)]">Command Center</p>
        <h1 className="mega mb-8 text-4xl">Sign in.</h1>

        <label className="mono mb-2 block text-[var(--grey-1)]" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
          className="mb-6 w-full rounded-xl border border-[var(--hairline)] bg-[var(--paper-pure)] px-4 py-3 text-base outline-none focus:border-[var(--ink)]"
        />

        {error && (
          <p role="alert" className="mb-6 text-sm text-[var(--ink)]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || password.length === 0}
          className="mono flex w-full items-center justify-center gap-2 rounded-full bg-[var(--ink)] px-7 py-3.5 text-[var(--paper)] transition-opacity disabled:opacity-40"
        >
          {busy && <Loader2 size={14} className="animate-spin" />}
          {busy ? 'Signing in' : 'Sign in'}
        </button>

        <Link
          to="/"
          className="mono mt-8 inline-flex items-center gap-2 text-[var(--grey-1)] hover:text-[var(--ink)]"
        >
          <ArrowLeft size={14} /> Back to the site
        </Link>
      </form>
    </div>
  );
};

export default LoginForm;
