import { resolveProvider } from '../providers/ProviderRegistry.js';
import { bulkImportSongs } from './BulkIngestionService.js';

function badRequest(message, raw) {
  const error = new Error(message);
  error.status = 400;
  if (raw !== undefined) error.raw = raw;
  return error;
}

function extractSpotifyPlaylistId(input) {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)(\?|$)/);
  if (urlMatch && urlMatch[1]) return urlMatch[1];

  const uriMatch = trimmed.match(/^spotify:playlist:([a-zA-Z0-9]+)$/);
  if (uriMatch && uriMatch[1]) return uriMatch[1];

  if (/^[a-zA-Z0-9]+$/.test(trimmed)) return trimmed;

  return null;
}

export async function importPublicSpotifyPlaylist({
  libraryId,
  playlistUrlOrId,
  applyLabelIds,
}) {
  if (typeof libraryId !== 'string' || libraryId.trim().length === 0) {
    throw badRequest('libraryId is required and must be a non-empty string', { libraryId });
  }

  const playlistId = extractSpotifyPlaylistId(playlistUrlOrId);
  if (!playlistId) {
    throw badRequest('playlistUrlOrId must be a Spotify playlist URL, URI, or ID', {
      playlistUrlOrId: playlistUrlOrId ?? null,
    });
  }

  const provider = await resolveProvider('SPOTIFY');
  if (typeof provider?.getPlaylistTrackIds !== 'function') {
    const err = new Error('Spotify provider does not support playlist import');
    err.status = 501;
    throw err;
  }

  const trackIds = await provider.getPlaylistTrackIds(playlistId);
  const items = (Array.isArray(trackIds) ? trackIds : [])
    .filter((id) => typeof id === 'string' && id.trim().length > 0)
    .map((id) => ({ spotifyTrackId: id.trim() }));

  if (!Array.isArray(items) || items.length === 0) {
    throw badRequest('Playlist contained no importable tracks', { playlistId });
  }

  return bulkImportSongs({
    libraryId: libraryId.trim(),
    providerType: 'SPOTIFY',
    items,
    applyLabelIds,
  });
}
