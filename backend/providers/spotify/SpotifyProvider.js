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

  _normalizeTrack(track) {
    const album = track?.album?.name;
    const artwork = track?.album?.images?.[0]?.url;
    const durationMs = track?.duration_ms;

    return {
      title: track?.name,
      artist: track?.artists?.[0]?.name || '',
      providerTrackId: track?.id,
      providerType: SPOTIFY,
      ...(typeof album === 'string' && album.trim().length > 0 ? { album } : {}),
      ...(typeof artwork === 'string' && artwork.trim().length > 0 ? { artwork } : {}),
      ...(typeof durationMs === 'number' && Number.isFinite(durationMs) && durationMs > 0
        ? { durationMs }
        : {}),
      raw: track,
    };
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
    url.searchParams.set('limit', '10');

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
    const results = items.map((track) => this._normalizeTrack(track));

    return results;
  }

  async import(trackId, options = {}) {
    if (typeof trackId !== 'string' || trackId.trim().length === 0) {
      throw new ProviderError({
        providerType: SPOTIFY,
        stage: 'input',
        reason: 'Missing required trackId',
        raw: { trackId: trackId ?? null },
      });
    }

    const accessToken = await this._getAccessToken();
    const id = trackId.trim();
    const url = `https://api.spotify.com/v1/tracks/${encodeURIComponent(id)}`;

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
        reason: 'Spotify track request failed',
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

      const stage =
        res.status === 401 || res.status === 403
          ? 'auth'
          : res.status === 404
            ? 'network'
            : 'provider';

      throw new ProviderError({
        providerType: SPOTIFY,
        stage,
        reason:
          stage === 'auth'
            ? 'Spotify track unauthorized'
            : stage === 'network'
              ? 'Spotify track not found'
              : 'Spotify track request rejected',
        raw: {
          status: res.status,
          spotifyMessage,
          trackId: id,
        },
      });
    }

    return this._normalizeTrack(payload);
  }

  async getPlaylistTrackIds(playlistId) {
    if (typeof playlistId !== 'string' || playlistId.trim().length === 0) {
      throw new ProviderError({
        providerType: SPOTIFY,
        stage: 'input',
        reason: 'Missing required playlistId',
        raw: { playlistId: playlistId ?? null },
      });
    }

    const accessToken = await this._getAccessToken();
    const id = playlistId.trim();

    const trackIds = [];
    let offset = 0;
    const limit = 100;

    for (;;) {
      const url = new URL(`https://api.spotify.com/v1/playlists/${encodeURIComponent(id)}/tracks`);
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('offset', String(offset));
      url.searchParams.set('fields', 'items(track(id)),next,total');

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
          reason: 'Spotify playlist tracks request failed',
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
          reason: stage === 'auth' ? 'Spotify playlist unauthorized' : 'Spotify playlist request rejected',
          raw: {
            status: res.status,
            spotifyMessage,
            playlistId: id,
            offset,
            limit,
          },
        });
      }

      const items = Array.isArray(payload?.items) ? payload.items : [];
      for (const item of items) {
        const tid = item?.track?.id;
        if (typeof tid === 'string' && tid.trim().length > 0) {
          trackIds.push(tid.trim());
        }
      }

      const total = typeof payload?.total === 'number' ? payload.total : null;
      offset += limit;

      if (payload?.next) {
        continue;
      }

      if (typeof total === 'number' && trackIds.length < total) {
        continue;
      }

      break;
    }

    return trackIds;
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
