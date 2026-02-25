import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/store';
import { songApi } from '@/services/songApi';
import { labelApi } from '@/services/labelApi';
import { providerApi } from '@/services/providerApi';
import * as libraryApi from '@/services/libraryApi';
import type { SongId, LabelId } from '@/types/entities';
import { BulkSongImportModal } from '@/components/modals/BulkSongImportModal';

export function LeftPanel() {
  const contentType = useStore((state) => state.left.contentType);
  const closePanel = useStore((state) => state.closePanel);

  const [isBulkSongImportOpen, setIsBulkSongImportOpen] = useState(false);

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
          <BulkSongImportModal
            isOpen={isBulkSongImportOpen}
            onClose={() => setIsBulkSongImportOpen(false)}
          />
          <button
            type="button"
            onClick={() => setIsBulkSongImportOpen(true)}
            className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            Bulk Import Songs
          </button>
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
  const removeAllInstancesOfEntity = useStore((state) => state.removeAllInstancesOfEntity);
  const setPanelContent = useStore((state) => state.setPanelContent);
  const activeLibraryId = useStore((state) => state.activeLibraryId);
  const setLibraryData = useStore((state) => state.setLibraryData);
  const setSongs = useStore((state) => state.setSongs);
  const setSongSources = useStore((state) => state.setSongSources);
  const setLabels = useStore((state) => state.setLabels);
  const setSongLabels = useStore((state) => state.setSongLabels);
  const setModes = useStore((state) => state.setModes);

  const [isDeleteArmed, setIsDeleteArmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
    if (isDeleting) return;

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

    if (!activeLibraryId) {
      window.alert('No active library selected.');
      return;
    }

    setIsDeleting(true);
    try {
      await songApi.delete(songId);
      removeAllInstancesOfEntity(songId);

      const data = await libraryApi.bootstrapLibrary(activeLibraryId);
      setLibraryData(data.library);
      setSongs(data.songs ?? []);
      setSongSources(data.songSources ?? []);
      setLabels(data.labels ?? [], data.superLabels ?? []);
      setSongLabels(data.songLabels ?? []);
      setModes(data.labelModes ?? []);

      setPanelContent('left', 'song-list');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete song.';
      window.alert(message);
    } finally {
      setIsDeleting(false);
    }
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

  const handleAlbumArtDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData('application/x-audiofile-song', song.songId);
    event.dataTransfer.setData('text/plain', `song:${song.songId}`);
    event.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="space-y-4">
      <div
        draggable
        onDragStart={handleAlbumArtDragStart}
        className="w-[120px] h-[120px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/40 cursor-grab active:cursor-grabbing"
        title="Drag to canvas"
      >
        {song.albumArtUrl ? (
          <img
            src={song.albumArtUrl}
            alt=""
            className="w-full h-full object-cover"
            draggable={false}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 dark:bg-gray-800" />
        )}
      </div>

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
        disabled={isDeleting}
        className={`w-full px-3 py-2 text-sm rounded-md border border-red-600 dark:border-red-500 bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 ${
          isDeleteArmed ? 'ring-2 ring-red-400 ring-offset-2 ring-offset-panel-light dark:ring-offset-panel-dark' : ''
        } ${isDeleting ? 'opacity-60 cursor-not-allowed' : ''}`}
        onClick={() => void handleDeleteSong()}
      >
        {isDeleting
          ? 'Deleting…'
          : isDeleteArmed
            ? 'Click again to permanently delete'
            : 'Delete Song (Permanent)'}
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
    openPanel('left', 'song-info', songId);
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, songId: SongId) => {
    event.dataTransfer.setData('application/x-audiofile-song', songId);
    event.dataTransfer.setData('text/plain', `song:${songId}`);
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
  const openPanel = useStore((state) => state.openPanel);
  const songsById = useStore((state) => state.songsById);
  const songIds = useStore((state) => state.songIds);
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!normalizedQuery) return [];
    return songIds
      .map((id) => songsById[id])
      .filter(Boolean)
      .filter((song) => {
        const haystack = [
          song.nickname,
          song.displayTitle,
          song.displayArtist,
          song.officialTitle,
          song.officialArtist,
          song.albumName,
        ]
          .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .slice(0, 50);
  }, [normalizedQuery, songIds, songsById]);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs in your library…"
          className="w-full h-9 px-3 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md"
        />
      </div>

      {normalizedQuery.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/30 py-6 text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">Type to search your library songs</p>
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/30 py-6 text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">No matches found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((song) => {
            const title = song.nickname || song.displayTitle;
            const subtitle = song.displayArtist;
            return (
              <div
                key={song.songId}
                onClick={() => openPanel('left', 'song-info', song.songId)}
                className="cursor-pointer rounded-md border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/40 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900"
                title={title}
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {subtitle}
                </div>
              </div>
            );
          })}
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
  const activeLibraryId = useStore((state) => state.activeLibraryId);
  const setLibraryData = useStore((state) => state.setLibraryData);
  const setSongs = useStore((state) => state.setSongs);
  const songSources = useStore((state) => state.songSources);
  const setSongSources = useStore((state) => state.setSongSources);
  const setLabels = useStore((state) => state.setLabels);
  const setSongLabels = useStore((state) => state.setSongLabels);
  const setModes = useStore((state) => state.setModes);

  const [mode, setMode] = useState<'manual' | 'provider'>('manual');

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [providerQuery, setProviderQuery] = useState('');
  const [providerResults, setProviderResults] = useState<Array<{
    title: string;
    artist: string;
    providerTrackId: string;
    providerType: string;
    album?: string;
    artwork?: string;
  }>>([]);
  const [isSearchingProviders, setIsSearchingProviders] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [importingTrackId, setImportingTrackId] = useState<string | null>(null);

  const importedProviderKeys = useMemo(() => {
    const set = new Set<string>();
    for (const src of songSources) {
      if (!src?.providerType || !src?.externalId) continue;
      set.add(`${src.providerType}:${src.externalId}`);
    }
    return set;
  }, [songSources]);

  useEffect(() => {
    if (mode !== 'provider') {
      return;
    }

    const q = providerQuery.trim();
    if (!q) {
      setProviderResults([]);
      setProviderError(null);
      setIsSearchingProviders(false);
      return;
    }

    setIsSearchingProviders(true);
    setProviderError(null);

    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await providerApi.searchProviders({
            providerType: 'SPOTIFY',
            query: q,
          });
          setProviderResults(response.results ?? []);
        } catch (error) {
          const message =
            typeof (error as { reason?: unknown })?.reason === 'string'
              ? String((error as { reason: string }).reason)
              : error instanceof Error
                ? error.message
                : 'Provider search failed.';
          setProviderResults([]);
          setProviderError(message);
        } finally {
          setIsSearchingProviders(false);
        }
      })();
    }, 450);

    return () => window.clearTimeout(handle);
  }, [mode, providerQuery]);

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

  const handleImportProviderResult = async (result: {
    providerTrackId: string;
    providerType: string;
  }) => {
    if (!activeLibraryId) {
      window.alert('No active library selected.');
      return;
    }

    if (importingTrackId) return;

    setImportingTrackId(result.providerTrackId);
    try {
      await providerApi.importProviderTrackToLibrary({
        libraryId: activeLibraryId,
        providerType: result.providerType,
        providerTrackId: result.providerTrackId,
        starterLabelIds: [],
      });

      const data = await libraryApi.bootstrapLibrary(activeLibraryId);
      setLibraryData(data.library);
      setSongs(data.songs ?? []);
      setSongSources(data.songSources ?? []);
      setLabels(data.labels ?? [], data.superLabels ?? []);
      setSongLabels(data.songLabels ?? []);
      setModes(data.labelModes ?? []);

      setProviderQuery('');
      setProviderResults([]);
      setPanelContent('left', 'song-list');
    } catch (error) {
      const message =
        typeof (error as { reason?: unknown })?.reason === 'string'
          ? String((error as { reason: string }).reason)
          : error instanceof Error
            ? error.message
            : 'Failed to import track.';
      window.alert(message);
    } finally {
      setImportingTrackId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="inline-flex w-full rounded-md border border-gray-200 dark:border-gray-800 overflow-hidden">
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex-1 px-3 py-2 text-sm ${
            mode === 'manual'
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
              : 'bg-white/80 dark:bg-gray-900/40 text-gray-600 dark:text-gray-300'
          }`}
        >
          Manual
        </button>
        <button
          type="button"
          onClick={() => setMode('provider')}
          className={`flex-1 px-3 py-2 text-sm ${
            mode === 'provider'
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
              : 'bg-white/80 dark:bg-gray-900/40 text-gray-600 dark:text-gray-300'
          }`}
        >
          Provider
        </button>
      </div>

      {mode === 'manual' ? (
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
      ) : (
        <div className="space-y-2">
          <input
            value={providerQuery}
            onChange={(e) => setProviderQuery(e.target.value)}
            placeholder="Search Spotify tracks…"
            className="w-full h-9 px-3 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md"
          />

          {isSearchingProviders ? (
            <div className="text-xs text-gray-500 dark:text-gray-400">Searching…</div>
          ) : null}

          {providerError ? (
            <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/40 p-2 text-xs text-gray-600 dark:text-gray-300">
              {providerError}
            </div>
          ) : null}

          {providerQuery.trim().length > 0 && !isSearchingProviders && !providerError && providerResults.length === 0 ? (
            <div className="rounded-md border border-dashed border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/30 p-3 text-center text-xs text-gray-500 dark:text-gray-400">
              No results
            </div>
          ) : null}

          {providerResults.length > 0 ? (
            <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/40">
              {providerResults.map((r) => (
                (() => {
                  const isImported = importedProviderKeys.has(`${r.providerType}:${r.providerTrackId}`);
                  const isDisabled = importingTrackId !== null || isImported;
                  return (
                <button
                  key={`${r.providerType}:${r.providerTrackId}`}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => void handleImportProviderResult({
                    providerTrackId: r.providerTrackId,
                    providerType: r.providerType,
                  })}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50 ${
                    isImported ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex-shrink-0 rounded bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      {r.artwork ? (
                        <img src={r.artwork} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate" title={r.title}>
                        {r.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate" title={r.artist}>
                        {r.artist}
                      </div>
                      {r.album ? (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate" title={r.album}>
                          {r.album}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {isImported ? 'Imported' : importingTrackId === r.providerTrackId ? 'Importing…' : 'Import'}
                    </div>
                  </div>
                </button>
                  );
                })()
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
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
