import { useState } from 'react';
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
    <div>
      <h1>Login</h1>
      <form onSubmit={(event) => void handleSubmit(event)}>
        <div>
          <label>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
        </div>
        <div>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Login'}
        </button>
        {error && <div>{error}</div>}
      </form>
    </div>
  );
}
