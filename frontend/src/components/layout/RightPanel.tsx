/**
 * AudioFile Right Panel Component
 * 
 * Contains:
 * - Labels list (Workshop 2/2.1)
 * - Label info (Workshop 5)
 * - Song info (Workshop 5.1)
 * - Add Label/Superlabel flow (Workshop 4/4.1)
 * 
 * Panel content is determined by state (panelsSlice).
 */

import { useStore } from '@/store';

export function RightPanel() {
  const contentType = useStore((state) => state.right.contentType);
  const closePanel = useStore((state) => state.closePanel);

  return (
    <aside className="w-80 flex flex-col bg-panel-light dark:bg-panel-dark border-l border-gray-200 dark:border-gray-800">
      {/* Panel header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {getPanelTitle(contentType)}
        </h2>
        <button
          onClick={() => closePanel('right')}
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
    case 'label-list':
      return 'Labels';
    case 'label-info':
      return 'Label Details';
    case 'superlabel-info':
      return 'Super Label Details';
    case 'song-info':
      return 'Song Details';
    case 'add-label':
      return 'Add Label';
    case 'add-superlabel':
      return 'Add Super Label';
    default:
      return 'Labels';
  }
}

function PanelContent({ contentType }: { contentType: string | null }) {
  switch (contentType) {
    case 'label-list':
      return <LabelListPlaceholder />;
    case 'label-info':
      return <LabelInfoPlaceholder />;
    case 'superlabel-info':
      return <SuperLabelInfoPlaceholder />;
    case 'song-info':
      return <SongInfoPlaceholder />;
    case 'add-label':
      return <AddLabelPlaceholder />;
    case 'add-superlabel':
      return <AddSuperLabelPlaceholder />;
    default:
      return <LabelListPlaceholder />;
  }
}

// Placeholder components - will be replaced with real implementations

function LabelListPlaceholder() {
  const labelCount = useStore((state) => state.labelIds.length);
  const superLabelCount = useStore((state) => state.superLabelIds.length);
  
  return (
    <div className="space-y-4">
      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
        <p className="text-sm">{labelCount} labels</p>
        <p className="text-sm">{superLabelCount} super labels</p>
        <p className="text-xs mt-2">Label list component coming soon</p>
      </div>
      
      {/* Show/Hide Superlabels toggle placeholder */}
      <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Show Super Labels
        </span>
        <button className="relative inline-flex h-5 w-9 items-center rounded-full bg-blue-500">
          <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-4 transition" />
        </button>
      </div>
    </div>
  );
}

function LabelInfoPlaceholder() {
  const entityId = useStore((state) => state.right.entityId);
  
  return (
    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
      <p className="text-sm">Label info for: {entityId || 'unknown'}</p>
      <p className="text-xs mt-2">Coming soon</p>
    </div>
  );
}

function SuperLabelInfoPlaceholder() {
  const entityId = useStore((state) => state.right.entityId);
  
  return (
    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
      <p className="text-sm">Super label info for: {entityId || 'unknown'}</p>
      <p className="text-xs mt-2">Coming soon</p>
    </div>
  );
}

function SongInfoPlaceholder() {
  const entityId = useStore((state) => state.right.entityId);
  
  return (
    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
      <p className="text-sm">Song info for: {entityId || 'unknown'}</p>
      <p className="text-xs mt-2">Coming soon</p>
    </div>
  );
}

function AddLabelPlaceholder() {
  return (
    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
      <p className="text-sm">Add label form coming soon</p>
    </div>
  );
}

function AddSuperLabelPlaceholder() {
  return (
    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
      <p className="text-sm">Add super label form coming soon</p>
    </div>
  );
}
