import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/store';
import { songApi } from '@/services/songApi';
import { labelApi } from '@/services/labelApi';
import { providerApi } from '@/services/providerApi';
import type { SongId, LabelId } from '@/types/entities';

export function LeftPanel() {
  const contentType = useStore((state) => state.left.contentType);
  const closePanel = useStore((state) => state.closePanel);

  return (
    <aside className="w-80 h-full min-h-0 flex flex-col bg-panel-light dark:bg-panel-dark border-r border-gray-200 dark:border-gray-800">
      {/* Sticky panel header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 bg-panel-light/95 dark:bg-panel-dark/95">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Library Controls</h2>
        <button
          onClick={() => closePanel('left')}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-6">
        <section className="space-y-3">
          <SectionHeader title="Songs" subtitle={getPanelTitle(contentType)} />
          <PanelContent contentType={contentType} />
        </section>

        <section className="space-y-3">
          <SectionHeader title="Labels" subtitle="Workspace labels" />
          <LabelsSummary />
        </section>

        <section className="space-y-3">
          <SectionHeader title="Filters" subtitle="Active canvas filters" />
          <FiltersSummary />
        </section>
      </div>
    </aside>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </p>
      {subtitle && (
        <p className="text-sm text-gray-600 dark:text-gray-300">{subtitle}</p>
      )}
    </div>
  );
}

function getPanelTitle(contentType: string | null): string {
  switch (contentType) {
    case 'song-list':
      return 'Songs on Canvas';
    case 'search-results':
      return 'Search Results';
    case 'add-song':
      return 'Add Song';
    case 'song-info':
      return 'Song Details';
    default:
      return 'Songs';
  }
}

function PanelContent({ contentType }: { contentType: string | null }) {
  switch (contentType) {
    case 'song-list':
      return <SongsOnCanvasList />;
    case 'search-results':
      return <SearchResultsPlaceholder />;
    case 'add-song':
      return <AddSongForm />;
    case 'song-info':
      return <SongInfo />;
    default:
      return <SongsOnCanvasList />;
  }
}

function SongInfo() {
  const songId = useStore((state) => state.left.entityId);
  const song = useStore((state) => (songId ? state.songsById[songId] : undefined));
  const labelsBySongId = useStore((state) => state.labelsBySongId);
  const labelsById = useStore((state) => state.labelsById);
  const removeSong = useStore((state) => state.removeSong);
  const removeAllInstancesOfEntity = useStore((state) => state.removeAllInstancesOfEntity);
  const setPanelContent = useStore((state) => state.setPanelContent);

  const [isDeleteArmed, setIsDeleteArmed] = useState(false);
  const deleteArmTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (deleteArmTimeoutRef.current !== null) {
        window.clearTimeout(deleteArmTimeoutRef.current);
      }
    };
  }, []);

  const handleDeleteSong = async () => {
    if (!songId) return;

    if (!isDeleteArmed) {
      setIsDeleteArmed(true);
      if (deleteArmTimeoutRef.current !== null) {
        window.clearTimeout(deleteArmTimeoutRef.current);
      }
      deleteArmTimeoutRef.current = window.setTimeout(() => {
        setIsDeleteArmed(false);
        deleteArmTimeoutRef.current = null;
      }, 2500);
      return;
    }

    setIsDeleteArmed(false);

    // ARCHITECTURAL GUARDRAIL:
    // This is a PERMANENT library-level delete of the canonical Song entity.
    // It must never be undoable and must never push an undo entry.
    // Canvas delete is intentionally different: it only deletes canvas instances and is undoable.
    const confirmed = window.confirm(
      'Permanently delete this song from your library? This cannot be undone.'
    );
    if (!confirmed) return;

    await songApi.delete(songId);
    removeSong(songId);
    removeAllInstancesOfEntity(songId);
    setPanelContent('left', 'song-list');
  };

  if (!songId) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/30 py-6 text-center text-gray-500 dark:text-gray-400">
        <p className="text-sm">No song selected</p>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/30 py-6 text-center text-gray-500 dark:text-gray-400">
        <p className="text-sm">Song not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/40 p-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={song.nickname || song.displayTitle}>
          {song.nickname || song.displayTitle}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={song.displayArtist}>
          {song.displayArtist}
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/40 p-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Labels
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(songId ? (labelsBySongId[songId as SongId] ?? []) : []).map((labelId) => (
            <span
              key={labelId}
              className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full"
            >
              {labelsById[labelId as LabelId]?.name ?? labelId}
            </span>
          ))}
          {songId && (labelsBySongId[songId as SongId] ?? []).length === 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">No labels</span>
          )}
        </div>
      </div>

      <button
        type="button"
        className={`w-full px-3 py-2 text-sm rounded-md border border-red-600 dark:border-red-500 bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 ${
          isDeleteArmed ? 'ring-2 ring-red-400 ring-offset-2 ring-offset-panel-light dark:ring-offset-panel-dark' : ''
        }`}
        onClick={() => void handleDeleteSong()}
      >
        {isDeleteArmed ? 'Click again to permanently delete' : 'Delete Song (Permanent)'}
      </button>
      <p className="text-xs text-red-700/80 dark:text-red-300/80">
        Permanent. Not undoable.
      </p>
    </div>
  );
}

function SongsOnCanvasList() {
  const items = useStore((state) => state.items);
  const songsById = useStore((state) => state.songsById);
  const clearSelection = useStore((state) => state.clearSelection);
  const selectInstance = useStore((state) => state.selectInstance);
  const openPanel = useStore((state) => state.openPanel);

  const songsOnCanvas = useMemo(() => {
    const songEntityIds = Array.from(
      new Set(items.filter((item) => item.type === 'song').map((item) => item.entityId))
    ) as SongId[];

    return songEntityIds
      .map((songId) => songsById[songId])
      .filter(Boolean)
      .sort((a, b) => {
        const aTitle = (a.officialTitle ?? a.displayTitle).toLowerCase();
        const bTitle = (b.officialTitle ?? b.displayTitle).toLowerCase();
        return aTitle.localeCompare(bTitle);
      });
  }, [items, songsById]);

  const handleSingleClick = (songId: SongId) => {
    const matchingInstanceIds = items
      .filter((item) => item.type === 'song' && item.entityId === songId)
      .map((item) => item.instanceId);

    clearSelection();
    matchingInstanceIds.forEach((instanceId) => selectInstance(instanceId));
  };

  const handleDoubleClick = (songId: SongId) => {
    openPanel('right', 'song-info', songId);
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, songId: SongId) => {
    event.dataTransfer.setData('application/x-audiofile-song', songId);
    event.dataTransfer.effectAllowed = 'copy';
  };

  if (songsOnCanvas.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/30 py-6 text-center text-gray-500 dark:text-gray-400">
        <p className="text-sm">No songs on canvas</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {songsOnCanvas.map((song) => {
        const title = song.officialTitle ?? song.displayTitle;
        return (
          <div
            key={song.songId}
            draggable
            onDragStart={(event) => handleDragStart(event, song.songId)}
            onClick={() => handleSingleClick(song.songId)}
            onDoubleClick={() => handleDoubleClick(song.songId)}
            className="cursor-pointer rounded-md border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/40 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900"
            title={title}
          >
            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {title}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {song.officialArtist ?? song.displayArtist}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SearchResultsPlaceholder() {
  const [scope, setScope] = useState<'library' | 'external'>('library');
  const [query, setQuery] = useState('');
  const [providerType, setProviderType] = useState('APPLE_MUSIC');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Array<{
    title: string;
    artist: string;
    providerTrackId: string;
    providerType: string;
    album?: string;
    artwork?: string;
    durationMs?: number;
    raw?: unknown;
  }>>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [importStateByKey, setImportStateByKey] = useState<
    Record<string, { status: 'idle' | 'loading' | 'success' | 'error'; message?: string }>
  >({});

  const handleExternalSearch = async () => {
    setHasSearched(true);
    setHasError(false);
    setIsLoading(true);
    try {
      const response = await providerApi.searchProviders({ providerType, query: query.trim() });
      setResults(response.results);
    } catch (err) {
      console.error('[ui.external_search]', err);
      setResults([]);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (item: {
    title: string;
    artist: string;
    providerTrackId: string;
    providerType: string;
    album?: string;
    artwork?: string;
    durationMs?: number;
    raw?: unknown;
  }) => {
    const key = `${item.providerType}:${item.providerTrackId}`;
    setImportStateByKey((prev) => ({ ...prev, [key]: { status: 'loading' } }));

    const displayTitle = item.title;
    const displayArtist = item.artist;

    const providerImport = {
      providerType: item.providerType,
      providerTrackId: item.providerTrackId,
    };

    const providerMetadata: Record<string, unknown> = {
      providerType: item.providerType,
      providerTrackId: item.providerTrackId,
      raw: item.raw,
    };

    const providerImportPartial =
      typeof providerImport.providerType !== 'string' ||
      providerImport.providerType.trim().length === 0 ||
      typeof providerImport.providerTrackId !== 'string' ||
      providerImport.providerTrackId.trim().length === 0;

    try {
      await songApi.create({
        displayTitle,
        displayArtist,
        officialTitle: null,
        officialArtist: null,
        albumName: item.album ?? null,
        albumArtUrl: item.artwork ?? null,
        durationMs: typeof item.durationMs === 'number' ? item.durationMs : null,
        providerMetadata,
        providerImport,
        providerImportPartial,
      });

      setImportStateByKey((prev) => ({
        ...prev,
        [key]: { status: 'success', message: 'Imported' },
      }));
    } catch (err) {
      console.error('[ui.external_search.import_failed]', err);
      setImportStateByKey((prev) => ({
        ...prev,
        [key]: { status: 'error', message: 'Import failed' },
      }));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setScope('library')}
          className={`px-3 py-1.5 text-sm rounded-md border ${
            scope === 'library'
              ? 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
              : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300'
          }`}
        >
          Library
        </button>
        <button
          type="button"
          onClick={() => setScope('external')}
          className={`px-3 py-1.5 text-sm rounded-md border ${
            scope === 'external'
              ? 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
              : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300'
          }`}
        >
          External
        </button>
      </div>

      {scope === 'library' && (
        <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/30 py-6 text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">Search results will appear here</p>
        </div>
      )}

      {scope === 'external' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <select
                value={providerType}
                onChange={(e) => setProviderType(e.target.value)}
                className="h-9 px-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md"
              >
                <option value="APPLE_MUSIC">APPLE_MUSIC</option>
              </select>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search external provider…"
                className="flex-1 h-9 px-3 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md"
              />
            </div>

            <button
              type="button"
              disabled={isLoading || query.trim().length === 0}
              onClick={() => void handleExternalSearch()}
              className="w-full px-3 py-2 text-sm rounded-md border border-blue-600 dark:border-blue-500 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
            >
              {isLoading ? 'Searching…' : 'Search'}
            </button>
          </div>

          {hasError && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/40 p-3 text-sm text-gray-600 dark:text-gray-300">
              Couldn’t fetch results. Try again.
            </div>
          )}

          {!hasError && hasSearched && !isLoading && results.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/30 py-6 text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">No matches found</p>
            </div>
          )}

          {!hasError && results.length > 0 && (
            <div className="space-y-2">
              {results.map((item) => (
                <div
                  key={`${item.providerType}:${item.providerTrackId}`}
                  className="rounded-md border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/40 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex-shrink-0 rounded bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      {item.artwork ? (
                        <img
                          src={item.artwork}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                          No Art
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate" title={item.title}>
                        {item.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate" title={item.artist}>
                        {item.artist}
                      </div>
                      {item.album && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate" title={item.album}>
                          {item.album}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <button
                        type="button"
                        onClick={() => void handleImport(item)}
                        disabled={importStateByKey[`${item.providerType}:${item.providerTrackId}`]?.status === 'loading'}
                        className="px-3 py-1.5 text-xs rounded-md border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-40"
                      >
                        {importStateByKey[`${item.providerType}:${item.providerTrackId}`]?.status === 'loading'
                          ? 'Importing…'
                          : 'Import'}
                      </button>
                      {importStateByKey[`${item.providerType}:${item.providerTrackId}`]?.status === 'success' && (
                        <span className="text-xs text-green-700/80 dark:text-green-300/80">Imported</span>
                      )}
                      {importStateByKey[`${item.providerType}:${item.providerTrackId}`]?.status === 'error' && (
                        <span className="text-xs text-red-700/80 dark:text-red-300/80">Import failed</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddSongForm() {
  const addSong = useStore((state) => state.addSong);
  const addLabel = useStore((state) => state.addLabel);
  const addSongLabel = useStore((state) => state.addSongLabel);
  const labelsById = useStore((state) => state.labelsById);
  const setPanelContent = useStore((state) => state.setPanelContent);

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ensureManualLabel = async (): Promise<LabelId> => {
    const existing = Object.values(labelsById).find((label) => label.name === 'Manual');
    if (existing) return existing.labelId as LabelId;

    // TEMP[libraryId-coherence]: trace label creation call site (remove after Phase 11)
    console.log('TEMP[libraryId-coherence] LeftPanel.ensureManualLabel -> labelApi.create', {
      file: 'components/layout/LeftPanel.tsx',
      fn: 'ensureManualLabel',
      activeLibraryIdAtCall: useStore.getState().activeLibraryId,
      labelName: 'Manual',
      stack: new Error().stack,
    });
    const created = await labelApi.create({ name: 'Manual' });
    addLabel(created);
    return created.labelId;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !artist.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {

      // TEMP[libraryId-coherence]: trace song creation call site (remove after Phase 11)
      console.log('TEMP[libraryId-coherence] LeftPanel.AddSongForm -> songApi.create', {
        file: 'components/layout/LeftPanel.tsx',
        fn: 'handleSubmit',
        activeLibraryIdAtCall: useStore.getState().activeLibraryId,
        displayTitle: title.trim(),
        displayArtist: artist.trim(),
        stack: new Error().stack,
      });

      const createdSong = await songApi.create({
        displayTitle: title.trim(),
        displayArtist: artist.trim(),
        officialTitle: null,
        officialArtist: null,
      });
      addSong(createdSong);

      const manualLabelId = await ensureManualLabel();
      await labelApi.addToSong(createdSong.songId, manualLabelId);
      addSongLabel(createdSong.songId, manualLabelId);

      setPanelContent('left', 'song-info', createdSong.songId);
      setTitle('');
      setArtist('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full h-9 px-3 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Artist
        </label>
        <input
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          className="mt-1 w-full h-9 px-3 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting || !title.trim() || !artist.trim()}
        className="w-full px-3 py-2 text-sm rounded-md border border-blue-600 dark:border-blue-500 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
      >
        Create
      </button>
    </form>
  );
}

function LabelsSummary() {
  const labelCount = useStore((state) => state.labelIds.length);
  const superLabelCount = useStore((state) => state.superLabelIds.length);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/40 p-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
      <div className="flex items-center justify-between">
        <span>Total Labels</span>
        <span className="font-semibold text-gray-900 dark:text-white">{labelCount}</span>
      </div>
      <div className="flex items-center justify-between">
        <span>Super Labels</span>
        <span className="font-semibold text-gray-900 dark:text-white">{superLabelCount}</span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Detailed label management ships in a later phase.
      </p>
    </div>
  );
}

function FiltersSummary() {
  const activeLabelIds = useStore((state) => state.activeLabelIds);
  const allSongsActive = useStore((state) => state.allSongsActive);
  const labelsById = useStore((state) => state.labelsById);

  if (allSongsActive || activeLabelIds.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/40 p-3 text-sm text-gray-500 dark:text-gray-400">
        All songs visible
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/40 p-3 space-y-1 text-sm text-gray-700 dark:text-gray-200">
      {activeLabelIds.map((labelId) => (
        <div key={labelId} className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
          <span>{labelsById[labelId]?.name ?? labelId}</span>
          <span className="text-gray-400 dark:text-gray-500">Active</span>
        </div>
      ))}
    </div>
  );
}
