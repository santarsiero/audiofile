import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { apiClient } from '@/services/api';
import { setAccessToken, setRefreshToken } from '@/services/authTokens';

type RegisterResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    userId: string;
    email: string;
  };
};

export function Register() {
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
      const response = await apiClient.post<RegisterResponse>('auth/register', {
        email: email.trim(),
        password,
      });

      console.log('REGISTER RESPONSE', response);

      setAccessToken(response.accessToken);
      setRefreshToken(response.refreshToken);
      setAuthenticated(true);
      navigate('/library', { replace: true });
    } catch (err) {
      console.error('Registration failed', err);
      setAccessToken(null);
      setRefreshToken(null);
      setAuthenticated(false);
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1>Register</h1>
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
              autoComplete="new-password"
            />
          </label>
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Registering…' : 'Register'}
        </button>
        {error && <div>{error}</div>}
      </form>
    </div>
  );
}
