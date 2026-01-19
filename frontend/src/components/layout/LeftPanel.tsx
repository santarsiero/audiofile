/**
 * AudioFile Left Panel Component
 * 
 * Contains:
 * - Song list (Workshop 2)
 * - Search results (Workshop 3)
 * - Add Song flow (Workshop 4)
 * 
 * Panel content is determined by state (panelsSlice).
 */

import { useStore } from '@/store';

export function LeftPanel() {
  const contentType = useStore((state) => state.left.contentType);
  const closePanel = useStore((state) => state.closePanel);

  return (
    <aside className="w-80 flex flex-col bg-panel-light dark:bg-panel-dark border-r border-gray-200 dark:border-gray-800">
      {/* Panel header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {getPanelTitle(contentType)}
        </h2>
        <button
          onClick={() => closePanel('left')}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto p-4">
        <PanelContent contentType={contentType} />
      </div>
    </aside>
  );
}

function getPanelTitle(contentType: string | null): string {
  switch (contentType) {
    case 'song-list':
      return 'Songs';
    case 'search-results':
      return 'Search Results';
    case 'add-song':
      return 'Add Song';
    default:
      return 'Songs';
  }
}

function PanelContent({ contentType }: { contentType: string | null }) {
  switch (contentType) {
    case 'song-list':
      return <SongListPlaceholder />;
    case 'search-results':
      return <SearchResultsPlaceholder />;
    case 'add-song':
      return <AddSongPlaceholder />;
    default:
      return <SongListPlaceholder />;
  }
}

// Placeholder components - will be replaced with real implementations

function SongListPlaceholder() {
  const songCount = useStore((state) => state.songIds.length);
  
  return (
    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
      <p className="text-sm">{songCount} songs in library</p>
      <p className="text-xs mt-2">Song list component coming soon</p>
    </div>
  );
}

function SearchResultsPlaceholder() {
  return (
    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
      <p className="text-sm">Search results will appear here</p>
    </div>
  );
}

function AddSongPlaceholder() {
  return (
    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
      <p className="text-sm">Add song form coming soon</p>
    </div>
  );
}
