let accessToken: string | null = null;

const REFRESH_TOKEN_STORAGE_KEY = 'audiofile.refreshToken';

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function setRefreshToken(token: string | null): void {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
    return;
  }
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function clearTokens(): void {
  setAccessToken(null);
  setRefreshToken(null);
}
