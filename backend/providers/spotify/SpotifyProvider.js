import { ProviderInterface } from '../ProviderInterface.js';
import { SPOTIFY } from '../providerTypes.js';
import { ProviderError } from '../contracts/ProviderError.js';

export class SpotifyProvider extends ProviderInterface {
  constructor() {
    super();

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    this._clientId = clientId;
    this._clientSecret = clientSecret;

    this._accessToken = null;
    this._accessTokenExpiresAtMs = 0;
    this._tokenFetchCount = 0;

    if (
      typeof clientId !== 'string' ||
      clientId.trim().length === 0 ||
      typeof clientSecret !== 'string' ||
      clientSecret.trim().length === 0
    ) {
      throw new ProviderError({
        providerType: SPOTIFY,
        stage: 'config',
        reason: 'Missing Spotify credentials',
        raw: { providerType: SPOTIFY },
      });
    }
  }

  getProviderType() {
    return SPOTIFY;
  }

  async search(query, options = {}) {
    if (typeof query !== 'string' || query.trim().length === 0) {
      throw new ProviderError({
        providerType: SPOTIFY,
        stage: 'input',
        reason: 'Missing required search query',
        raw: { query: query ?? null },
      });
    }

    const accessToken = await this._getAccessToken();

    const url = new URL('https://api.spotify.com/v1/search');
    url.searchParams.set('q', query);
    url.searchParams.set('type', 'track');
    url.searchParams.set('limit', '25');

    let res;
    try {
      res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });
    } catch (err) {
      throw new ProviderError({
        providerType: SPOTIFY,
        stage: 'network',
        reason: 'Spotify search request failed',
        raw: { message: err?.message },
      });
    }

    let payload;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }

    if (!res.ok) {
      const spotifyMessage =
        payload && typeof payload === 'object'
          ? payload?.error?.message ?? payload?.error_description ?? payload?.error
          : undefined;

      const stage = res.status === 401 || res.status === 403 ? 'auth' : 'provider';

      throw new ProviderError({
        providerType: SPOTIFY,
        stage,
        reason: stage === 'auth' ? 'Spotify search unauthorized' : 'Spotify search request rejected',
        raw: {
          status: res.status,
          spotifyMessage,
        },
      });
    }

    const items = Array.isArray(payload?.tracks?.items) ? payload.tracks.items : [];
    const results = items.map((track) => {
      return {
        title: track?.name,
        artist: track?.artists?.[0]?.name || '',
        providerTrackId: track?.id,
        providerType: SPOTIFY,
        album: track?.album?.name || null,
        artwork: track?.album?.images?.[0]?.url || null,
        durationMs: track?.duration_ms,
        raw: track,
      };
    });

    return results;
  }

  async _getAccessToken() {
    const now = Date.now();
    const safetyBufferMs = 30_000;

    if (this._accessToken && now < this._accessTokenExpiresAtMs - safetyBufferMs) {
      return this._accessToken;
    }

    const basicAuth = Buffer.from(`${this._clientId}:${this._clientSecret}`).toString('base64');

    let res;
    try {
      this._tokenFetchCount += 1;
      res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basicAuth}`,
        },
        body: 'grant_type=client_credentials',
      });
    } catch (err) {
      throw new ProviderError({
        providerType: SPOTIFY,
        stage: 'network',
        reason: 'Spotify token request failed',
        raw: { message: err?.message },
      });
    }

    let payload;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }

    if (!res.ok) {
      const spotifyMessage =
        payload && typeof payload === 'object'
          ? payload?.error_description ?? payload?.error?.message ?? payload?.error
          : undefined;

      throw new ProviderError({
        providerType: SPOTIFY,
        stage: 'auth',
        reason: 'Spotify token request rejected',
        raw: {
          status: res.status,
          spotifyMessage,
        },
      });
    }

    const accessToken = payload?.access_token;
    const expiresIn = payload?.expires_in;

    if (typeof accessToken !== 'string' || accessToken.trim().length === 0) {
      throw new ProviderError({
        providerType: SPOTIFY,
        stage: 'auth',
        reason: 'Spotify token request rejected',
        raw: { status: res.status, spotifyMessage: 'Missing access_token' },
      });
    }

    const expiresInSeconds = typeof expiresIn === 'number' && expiresIn > 0 ? expiresIn : 0;
    this._accessToken = accessToken;
    this._accessTokenExpiresAtMs = Date.now() + expiresInSeconds * 1000;

    return accessToken;
  }
}
