import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/store';
import { providerApi } from '@/services/providerApi';
import * as libraryApi from '@/services/libraryApi';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function BulkSongImportModal({ isOpen, onClose }: Props) {
  const activeLibraryId = useStore((state) => state.activeLibraryId);
  const labelIds = useStore((state) => state.labelIds);
  const labelsById = useStore((state) => state.labelsById);

  const setLibraryData = useStore((state) => state.setLibraryData);
  const setSongs = useStore((state) => state.setSongs);
  const setSongSources = useStore((state) => state.setSongSources);
  const setLabels = useStore((state) => state.setLabels);
  const setSongLabels = useStore((state) => state.setSongLabels);
  const setModes = useStore((state) => state.setModes);

  const [file, setFile] = useState<File | null>(null);
  const [playlistUrlOrId, setPlaylistUrlOrId] = useState('');
  const [labelSearch, setLabelSearch] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ processed: number; total: number } | null>(null);
  const [report, setReport] = useState<
    | {
        summary: {
          total: number;
          imported: number;
          duplicates: number;
          exactMatches: number;
          fuzzyMatches: number;
          misses: number;
          missingFields: number;
          errors: number;
        };
        results: Array<{
          input: {
            title: unknown;
            artist: unknown;
            spotifyTrackId: unknown;
            appleMusicSongId: unknown;
          };
          status: string;
          match: unknown;
        }>;
      }
    | null
  >(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setPlaylistUrlOrId('');
      setLabelSearch('');
      setSelectedLabelIds(new Set());
      setLoading(false);
      setProgress(null);
      setReport(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }, [isOpen]);

  const normalizedQuery = labelSearch.trim().toLowerCase();
  const filteredLabels = useMemo(() => {
    const base = labelIds
      .map((id) => labelsById[id])
      .filter(Boolean)
      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

    if (!normalizedQuery) return base;

    return base.filter((label) => label.name.toLowerCase().includes(normalizedQuery));
  }, [labelIds, labelsById, normalizedQuery]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabelIds((prev) => {
      const next = new Set(prev);
      if (next.has(labelId)) {
        next.delete(labelId);
      } else {
        next.add(labelId);
      }
      return next;
    });
  };

  const handleImportPlaylist = async () => {
    if (!activeLibraryId) {
      window.alert('No active library selected.');
      return;
    }

    if (!playlistUrlOrId.trim()) {
      window.alert('Please paste a Spotify playlist URL or ID.');
      return;
    }

    setLoading(true);
    setProgress(null);
    setReport(null);

    try {
      const applyLabelIds = Array.from(selectedLabelIds);

      const bulkResult = await providerApi.importPublicSpotifyPlaylistToLibrary({
        libraryId: activeLibraryId,
        playlistUrlOrId: playlistUrlOrId.trim(),
        applyLabelIds,
      });

      setProgress({ processed: bulkResult.summary.total, total: bulkResult.summary.total });
      setReport({
        summary: bulkResult.summary,
        results: bulkResult.results,
      });

      const data = await libraryApi.bootstrapLibrary(activeLibraryId);
      setLibraryData(data.library);
      setSongs(data.songs ?? []);
      setSongSources(data.songSources ?? []);
      setLabels(data.labels ?? [], data.superLabels ?? []);
      setSongLabels(data.songLabels ?? []);
      setModes(data.labelModes ?? []);

      const hadProblems = bulkResult.results.some((r) => r.status !== 'imported' && r.status !== 'duplicate');
      if (!hadProblems) {
        window.alert('All songs imported successfully.');
        onClose();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import playlist.';
      window.alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!activeLibraryId) {
      window.alert('No active library selected.');
      return;
    }

    if (!file) {
      window.alert('Please select a JSON file to import.');
      return;
    }

    setLoading(true);
    setProgress(null);
    setReport(null);

    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        const cleaned = text.replace(/^\uFEFF/, '').trim();
        if (!cleaned) {
          window.alert('Invalid JSON file. File is empty.');
          return;
        }
        parsed = JSON.parse(cleaned);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to parse JSON.';
        const cleaned = text.replace(/^\uFEFF/, '').trim();
        const hints = [] as string[];
        if (/\bNaN\b/.test(cleaned)) {
          hints.push('Replace NaN with null (JSON does not support NaN).');
        }
        if (/,\s*[\]}]/.test(cleaned)) {
          hints.push('Remove trailing commas before ] or } (not allowed in JSON).');
        }
        window.alert(
          `Invalid JSON file. ${message}${hints.length > 0 ? `\n\nFix: ${hints.join(' ')}` : ''}`
        );
        return;
      }

      const items = Array.isArray(parsed) ? parsed : (parsed as { items?: unknown }).items;
      if (!Array.isArray(items)) {
        window.alert('JSON must be an array or an object with an "items" array.');
        return;
      }

      const total = items.length;
      setProgress({ processed: 0, total });

      const applyLabelIds = Array.from(selectedLabelIds);

      const normalizedItems = items.map((row) => {
        const obj = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
        const title = typeof obj.title === 'string' ? obj.title : null;
        const artist = typeof obj.artist === 'string' ? obj.artist : null;
        const spotifyTrackId =
          typeof obj.spotifyTrackId === 'string'
            ? obj.spotifyTrackId
            : typeof obj.providerTrackId === 'string'
              ? obj.providerTrackId
              : null;
        const appleMusicSongId = typeof obj.appleMusicSongId === 'string' ? obj.appleMusicSongId : null;
        return {
          title,
          artist,
          spotifyTrackId,
          appleMusicSongId,
        };
      });

      const bulkResult = await providerApi.bulkImportProviderSongs({
        libraryId: activeLibraryId,
        providerType: 'SPOTIFY',
        items: normalizedItems,
        applyLabelIds,
      });

      setProgress({ processed: total, total });

      setReport({
        summary: bulkResult.summary,
        results: bulkResult.results,
      });

      const data = await libraryApi.bootstrapLibrary(activeLibraryId);
      setLibraryData(data.library);
      setSongs(data.songs ?? []);
      setSongSources(data.songSources ?? []);
      setLabels(data.labels ?? [], data.superLabels ?? []);
      setSongLabels(data.songLabels ?? []);
      setModes(data.labelModes ?? []);

      const hadProblems = bulkResult.results.some((r) => r.status !== 'imported' && r.status !== 'duplicate');
      if (!hadProblems) {
        window.alert('All songs imported successfully.');
        onClose();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import songs.';
      window.alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-neutral-900 rounded-xl p-6 w-[500px] max-h-[80vh] overflow-y-auto border border-neutral-750 shadow-af-lg">
        <div className="text-lg font-semibold text-neutral-100">Bulk Import Songs</div>

        {progress ? (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>
                Processed: {progress.processed} / {progress.total}
              </span>
              <span>
                {progress.total > 0
                  ? `${Math.round((progress.processed / progress.total) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <div className="mt-2 h-2 w-full rounded-af-pill bg-neutral-800 overflow-hidden border border-neutral-750">
              <div
                className="h-full bg-neutral-500"
                style={{
                  width:
                    progress.total > 0
                      ? `${Math.min(100, Math.round((progress.processed / progress.total) * 100))}%`
                      : '0%',
                }}
              />
            </div>
          </div>
        ) : null}

        {report ? (
          <div className="mt-4 rounded-af-md border border-neutral-750 bg-neutral-900/40 p-3">
            <div className="text-sm font-semibold text-neutral-200">Import Report</div>
            <div className="mt-2 text-xs text-neutral-500 space-y-1">
              <div>Total: {report.summary.total}</div>
              <div>Imported: {report.summary.imported}</div>
              <div>Duplicates: {report.summary.duplicates}</div>
              <div>Exact Matches: {report.summary.exactMatches}</div>
              <div>Fuzzy Matches: {report.summary.fuzzyMatches}</div>
              <div>Misses: {report.summary.misses}</div>
              <div>Missing Fields: {report.summary.missingFields}</div>
              <div>Errors: {report.summary.errors}</div>
            </div>
            {report.results.some((r) => r.status !== 'imported' && r.status !== 'duplicate') ? (
              <div className="mt-3 max-h-40 overflow-y-auto rounded-af-md border border-neutral-750 bg-neutral-950/30 p-2">
                <div className="text-xs font-semibold text-neutral-300">Details</div>
                <div className="mt-2 space-y-1">
                  {report.results
                    .filter((r) => r.status !== 'imported' && r.status !== 'duplicate')
                    .slice(0, 200)
                    .map((m, idx) => (
                    <div key={idx} className="text-xs text-neutral-500">
                      {typeof m.input?.title === 'string' ? m.input.title : String(m.input?.title ?? '')} —{' '}
                      {typeof m.input?.artist === 'string' ? m.input.artist : String(m.input?.artist ?? '')}:
                      {' '}
                      {m.status}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 space-y-2">
          <div className="text-sm font-semibold text-neutral-200">Import Public Spotify Playlist</div>
          <input
            value={playlistUrlOrId}
            onChange={(e) => setPlaylistUrlOrId(e.target.value)}
            placeholder="Paste Spotify playlist URL or ID…"
            className="w-full h-9 px-3 text-sm bg-neutral-800 text-neutral-100 border border-neutral-750 rounded-af-md placeholder:text-neutral-500 focus:ring-1 focus:ring-neutral-400 focus:border-neutral-500 focus:outline-none"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => void handleImportPlaylist()}
            disabled={loading || !playlistUrlOrId.trim()}
            className="w-full px-3 py-2 text-sm rounded-af-md border border-neutral-600 bg-neutral-700 text-neutral-100 hover:bg-neutral-600 disabled:opacity-40"
          >
            {loading ? 'Importing…' : 'Import Playlist'}
          </button>
          <div className="text-xs text-neutral-500">
            Playlist must be public to import without Spotify OAuth.
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept=".json"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-neutral-200 file:mr-4 file:py-2 file:px-3 file:rounded-af-md file:border-0 file:text-sm file:font-medium file:bg-neutral-800 file:text-neutral-200 hover:file:bg-neutral-700"
            disabled={loading}
          />
          <div className="text-xs text-neutral-500">
            {file ? `Selected: ${file.name}` : 'No file selected'}
          </div>
        </div>

        <div className="mt-6">
          <div className="text-sm font-semibold text-neutral-200">Assign Labels to All Imported Songs</div>
          <input
            value={labelSearch}
            onChange={(e) => setLabelSearch(e.target.value)}
            placeholder="Search labels…"
            className="mt-2 w-full h-9 px-3 text-sm bg-neutral-800 text-neutral-100 border border-neutral-750 rounded-af-md placeholder:text-neutral-500 focus:ring-1 focus:ring-neutral-400 focus:border-neutral-500 focus:outline-none"
            disabled={loading}
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {filteredLabels.slice(0, 80).map((label) => {
              const selected = selectedLabelIds.has(label.labelId);
              return (
                <button
                  key={label.labelId}
                  type="button"
                  onClick={() => toggleLabel(label.labelId)}
                  disabled={loading}
                  className={
                    selected
                      ? 'px-3 py-1.5 text-xs rounded-af-pill border border-neutral-400 bg-neutral-700 text-neutral-100 ring-1 ring-neutral-400'
                      : 'px-3 py-1.5 text-xs rounded-af-pill border border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
                  }
                >
                  {label.name}
                </button>
              );
            })}
          </div>

          {selectedLabelIds.size > 0 ? (
            <div className="mt-2 text-xs text-neutral-500">
              Selected: {selectedLabelIds.size}
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-3 py-2 text-sm rounded-af-md border border-neutral-750 text-neutral-200 hover:bg-neutral-800 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleImport()}
            disabled={loading || !file}
            className="px-3 py-2 text-sm rounded-af-md border border-neutral-600 bg-neutral-700 text-neutral-100 hover:bg-neutral-600 disabled:opacity-40"
          >
            {loading ? 'Importing…' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
