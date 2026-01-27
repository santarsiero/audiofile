import { useStore } from '@/store';

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

function SongListPlaceholder() {
  const songCount = useStore((state) => state.songIds.length);

  return (
    <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/30 py-6 text-center text-gray-500 dark:text-gray-400">
      <p className="text-sm">{songCount} songs in library</p>
      <p className="text-xs mt-2">Song list component coming soon</p>
    </div>
  );
}

function SearchResultsPlaceholder() {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/30 py-6 text-center text-gray-500 dark:text-gray-400">
      <p className="text-sm">Search results will appear here</p>
    </div>
  );
}

function AddSongPlaceholder() {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/30 py-6 text-center text-gray-500 dark:text-gray-400">
      <p className="text-sm">Add song form coming soon</p>
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
