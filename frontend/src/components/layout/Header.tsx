/**
 * AudioFile Header Component
 * 
 * Contains:
 * - "My Music" / "My Library" tabs (My Music disabled for MVP)
 * - Global search bar
 * - Help, notifications, settings, avatar icons
 * - Sub-header with Search/Add buttons and Active Labels row
 * 
 * From Frontend MVP Source of Truth:
 * - "My Music" is a disabled placeholder (non-interactive)
 * - "My Library" is the only active view
 */

import { useMemo, useState } from 'react';
import { useStore } from '@/store';
import { clearTokens } from '@/services/authTokens';
import type { LabelId } from '@/types/entities';

export function Header() {
  const theme = useStore((state) => state.theme);
  const toggleTheme = useStore((state) => state.toggleTheme);
  const toggleRightPanel = useStore((state) => state.togglePanel);
  const openPanel = useStore((state) => state.openPanel);
  const activeLibraryId = useStore((state) => state.activeLibraryId);
  const canOpenCreatePanels = Boolean(activeLibraryId);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const songsById = useStore((state) => state.songsById);
  const songIds = useStore((state) => state.songIds);
  const labelsById = useStore((state) => state.labelsById);
  const labelIds = useStore((state) => state.labelIds);

  const [globalQuery, setGlobalQuery] = useState('');

  const normalizedGlobalQuery = globalQuery.trim().toLowerCase();
  const globalResults = useMemo(() => {
    if (!normalizedGlobalQuery) {
      return { songs: [], labels: [] };
    }

    const songs = songIds
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
        return haystack.includes(normalizedGlobalQuery);
      })
      .slice(0, 10);

    const labels = labelIds
      .map((id) => labelsById[id])
      .filter(Boolean)
      .filter((label) => label.name.toLowerCase().includes(normalizedGlobalQuery))
      .slice(0, 10);

    return { songs, labels };
  }, [labelIds, labelsById, normalizedGlobalQuery, songIds, songsById]);

  const shouldShowGlobalResults =
    normalizedGlobalQuery.length > 0 &&
    (globalResults.songs.length > 0 || globalResults.labels.length > 0);

  // TEMPORARY (Phase 11 bridge): Settings is not wired yet.
  // For Phase 11, clicking Settings logs out after confirmation.
  // Future intent: replace this handler with navigation to a real /settings page,
  // and move Logout into that Settings UI.
  const handleSettingsClick = () => {
    setIsLogoutConfirmOpen(true);
  };

  const handleConfirmLogout = () => {
    clearTokens();
    useStore.getState().setAuthenticated(false);
    window.location.href = '/login';
  };

  return (
    <header className="bg-surface-panel border-b border-neutral-750 sticky top-0 z-20">
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsLogoutConfirmOpen(false)}
          />
          <div className="relative w-full max-w-sm mx-4 rounded-af-xl border border-neutral-750 bg-neutral-850 shadow-af-float p-5">
            <div className="text-sm font-semibold text-gray-100">Log out of AudioFile?</div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                className="rounded-af-md border border-neutral-700 bg-transparent px-3 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800 transition-colors duration-af-fast"
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-af-md bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-950 hover:bg-white transition-colors duration-af-fast"
                type="button"
                onClick={handleConfirmLogout}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Main header row */}
      <div className="h-14 flex items-center px-4 gap-4">
        {/* Logo / App name */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded flex-shrink-0 bg-neutral-100 flex items-center justify-center">
            <svg className="w-3 h-3 text-neutral-950" fill="currentColor" viewBox="0 0 12 12">
              <path d="M4 1v6.268A2 2 0 1 0 5 9V4h3V1H4z" />
            </svg>
          </div>
          <span className="font-af-brand font-semibold text-neutral-100 tracking-tight text-[17px]">
            AudioFiles
          </span>
        </div>

        {/* Navigation tabs */}
        <nav className="flex items-center gap-1 ml-4">
          {/* My Music - Disabled placeholder */}
          <button
            disabled
            className="px-3 py-1.5 text-sm font-medium text-neutral-700 cursor-not-allowed opacity-40"
            title="Coming soon"
          >
            My Music
          </button>
          
          {/* My Library - Active */}
          <button
            className="px-3 py-1.5 text-sm font-medium text-neutral-100"
          >
            My Library
          </button>
        </nav>

        {/* Global search bar */}
        <div className="flex-1 max-w-xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search songs and labels..."
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              className="w-full h-9 px-4 pr-10 text-sm bg-neutral-800 border border-neutral-750 rounded-af-lg text-neutral-100 placeholder:text-neutral-500 focus:ring-1 focus:ring-neutral-600 focus:outline-none"
            />
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>

            {shouldShowGlobalResults && (
              <div className="absolute left-0 right-0 mt-2 rounded-af-lg border border-neutral-750 bg-neutral-850 shadow-af-float overflow-hidden z-50">
                <div className="max-h-[340px] overflow-y-auto">
                  {globalResults.songs.length > 0 && (
                    <div className="p-2">
                      <div className="px-2 py-1 text-af-label font-medium uppercase tracking-widest text-neutral-500">
                        Songs
                      </div>
                      <div className="space-y-1">
                        {globalResults.songs.map((song) => {
                          const title = song.nickname || song.displayTitle;
                          const subtitle = song.displayArtist;
                          return (
                            <button
                              key={song.songId}
                              type="button"
                              onClick={() => {
                                openPanel('left', 'song-info', song.songId);
                                setGlobalQuery('');
                              }}
                              className="w-full text-left rounded-af-md px-2 py-2 hover:bg-neutral-800 transition-colors duration-af-fast"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 flex-shrink-0 rounded-af-md overflow-hidden bg-neutral-800">
                                  {song.albumArtUrl ? (
                                    <img
                                      src={song.albumArtUrl}
                                      alt=""
                                      className="w-full h-full object-cover"
                                      draggable={false}
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="w-full h-full" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium text-neutral-100 truncate">
                                    {title}
                                  </div>
                                  <div className="text-af-xs text-neutral-500 truncate">
                                    {subtitle}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {globalResults.labels.length > 0 && (
                    <div className={`p-2 ${globalResults.songs.length > 0 ? 'border-t border-neutral-750' : ''}`}>
                      <div className="px-2 py-1 text-af-label font-medium uppercase tracking-widest text-neutral-500">
                        Labels
                      </div>
                      <div className="flex flex-wrap gap-2 px-2 py-2">
                        {globalResults.labels.map((label) => (
                          <button
                            key={label.labelId}
                            type="button"
                            onClick={() => {
                              openPanel('right', 'label-info', label.labelId);
                              setGlobalQuery('');
                            }}
                            className="px-3 py-1.5 text-xs rounded-af-pill bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-750 transition-colors duration-af-fast"
                          >
                            {label.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-neutral-500 hover:text-neutral-300 rounded-af-md hover:bg-neutral-800 transition-colors duration-af-fast"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Settings (placeholder) */}
          <button
            onClick={handleSettingsClick}
            className="p-2 text-neutral-500 hover:text-neutral-300 rounded-af-md hover:bg-neutral-800 transition-colors duration-af-fast"
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Sub-header row */}
      <div className="h-12 flex items-center px-4 gap-4 border-t border-neutral-750">
        {/* Left side: Song controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => openPanel('left', 'search-results')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded-af-md transition-colors duration-af-fast"
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search Song</span>
          </button>
          <button
            onClick={() => openPanel('left', 'add-song')}
            disabled={!canOpenCreatePanels}
            className="px-3 py-1.5 text-sm font-medium bg-neutral-100 text-neutral-950 hover:bg-white rounded-af-md disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-af-fast"
          >
            + Add Song
          </button>
        </div>

        {/* Center: Active Labels */}
        <div className="flex-1 min-w-0 flex items-center justify-center gap-2">
          <span className="text-af-label text-neutral-700 uppercase tracking-widest whitespace-nowrap">
            Active
          </span>
          <div className="flex-1 min-w-0">
            <ActiveLabelsRow />
          </div>
        </div>

        {/* Right side: Label controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => toggleRightPanel('right')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded-af-md transition-colors duration-af-fast"
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search Label</span>
          </button>
          <button
            onClick={() => openPanel('right', 'add-label')}
            disabled={!canOpenCreatePanels}
            className="px-3 py-1.5 text-sm font-medium border border-neutral-700 text-neutral-300 hover:bg-neutral-800 rounded-af-md disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-af-fast"
          >
            + Add Label
          </button>
        </div>
      </div>
    </header>
  );
}

/**
 * Active Labels Row Component
 * Displays currently active filter labels
 */
function ActiveLabelsRow() {
  const activeLabelIds = useStore((state) => state.activeLabelIds);
  const allSongsActive = useStore((state) => state.allSongsActive);
  const labelsById = useStore((state) => state.labelsById);
  const clearFilters = useStore((state) => state.clearFilters);
  const removeFilter = useStore((state) => state.removeFilter);
  const addFilter = useStore((state) => state.addFilter);
  const createSnapshot = useStore((state) => state.createSnapshot);
  const pushUndoEntry = useStore((state) => state.pushUndoEntry);

  const handleDragOver = (event: React.DragEvent) => {
    if (event.dataTransfer.types.includes('application/x-audiofile-label')) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    const labelId = event.dataTransfer.getData('application/x-audiofile-label') as LabelId;
    if (!labelId) return;
    if (activeLabelIds.includes(labelId)) return;

    event.preventDefault();

    const snapshot = createSnapshot();
    addFilter(labelId);
    pushUndoEntry({ action: 'filters', snapshot });
  };

  const containerClasses =
    'flex items-center gap-1.5 flex-nowrap overflow-x-auto overscroll-contain max-w-full min-h-[28px]';

  if (allSongsActive || activeLabelIds.length === 0) {
    return (
      <div className={containerClasses} onDragOver={handleDragOver} onDrop={handleDrop}>
        <span className="px-2.5 py-1 text-sm text-neutral-400 bg-neutral-800 rounded-af-pill whitespace-nowrap border border-neutral-750">
          All Songs
        </span>
      </div>
    );
  }

  return (
    <div className={containerClasses} onDragOver={handleDragOver} onDrop={handleDrop}>
      {activeLabelIds.map((labelId) => {
        const label = labelsById[labelId];
        return (
          <span
            key={labelId}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 text-sm bg-neutral-750 text-neutral-100 rounded-af-pill whitespace-nowrap flex-shrink-0 border border-neutral-700"
          >
            {label?.name || labelId}
            <button
              onClick={() => removeFilter(labelId)}
              className="hover:text-neutral-100 transition-colors duration-af-fast"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        );
      })}

      {activeLabelIds.length > 0 && (
        <button
          onClick={clearFilters}
          className="text-af-xs text-neutral-600 hover:text-neutral-400 ml-2 flex-shrink-0 transition-colors duration-af-fast"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
