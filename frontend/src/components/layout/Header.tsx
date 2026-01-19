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

import { useStore } from '@/store';

export function Header() {
  const theme = useStore((state) => state.theme);
  const toggleTheme = useStore((state) => state.toggleTheme);
  const toggleLeftPanel = useStore((state) => state.togglePanel);
  const toggleRightPanel = useStore((state) => state.togglePanel);

  return (
    <header className="bg-panel-light dark:bg-panel-dark border-b border-gray-200 dark:border-gray-800">
      {/* Main header row */}
      <div className="h-14 flex items-center px-4 gap-4">
        {/* Logo / App name */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold text-gray-900 dark:text-white">
            AudioFile
          </span>
        </div>

        {/* Navigation tabs */}
        <nav className="flex items-center gap-1 ml-4">
          {/* My Music - Disabled placeholder */}
          <button
            disabled
            className="px-4 py-2 text-sm font-medium text-gray-400 dark:text-gray-600 cursor-not-allowed"
            title="Coming soon"
          >
            My Music
          </button>
          
          {/* My Library - Active */}
          <button
            className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 rounded-md"
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
              className="w-full h-9 px-4 pr-10 text-sm bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
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
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
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
      <div className="h-12 flex items-center px-4 gap-4 border-t border-gray-100 dark:border-gray-800">
        {/* Left side: Song controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleLeftPanel('left')}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
          >
            Search Song
          </button>
          <button
            className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md"
          >
            + Add Song
          </button>
        </div>

        {/* Center: Active Labels */}
        <div className="flex-1 flex items-center justify-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Active Labels:
          </span>
          <ActiveLabelsRow />
        </div>

        {/* Right side: Label controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleRightPanel('right')}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
          >
            Search Label
          </button>
          <button
            className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md"
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

  if (allSongsActive || activeLabelIds.length === 0) {
    return (
      <span className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md">
        All Songs
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {activeLabelIds.map((labelId) => {
        const label = labelsById[labelId];
        return (
          <span
            key={labelId}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
          >
            {label?.name || labelId}
            <button
              onClick={() => removeFilter(labelId)}
              className="hover:text-blue-900 dark:hover:text-blue-100"
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
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ml-2"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
