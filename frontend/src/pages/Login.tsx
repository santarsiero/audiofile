import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { authApi } from '@/services/authApi';
import { setAccessToken, setRefreshToken } from '@/services/authTokens';

export function Login() {
  const navigate = useNavigate();
  const setAuthenticated = useStore((state) => state.setAuthenticated);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!error) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setError(null);
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [error]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authApi.login(email.trim(), password);
      setAccessToken(response.accessToken);
      setRefreshToken(response.refreshToken);
      setAuthenticated(true);
      navigate('/library', { replace: true });
    } catch (err) {
      setAccessToken(null);
      setRefreshToken(null);
      setAuthenticated(false);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-900/60 border border-gray-800 rounded-xl shadow-lg p-6">
        <h1 className="text-xl font-semibold text-gray-100">Login</h1>
        <form className="mt-6 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              className="mt-2 w-full rounded-md bg-gray-950 border border-gray-800 px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              className="mt-2 w-full rounded-md bg-gray-950 border border-gray-800 px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/60"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button
            className="w-full rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in…' : 'Login'}
          </button>
          <button
            className="w-full rounded-lg border border-gray-800 bg-transparent px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800/50"
            type="button"
            onClick={() => navigate('/register')}
          >
            Create an account
          </button>
          {error && (
            <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
