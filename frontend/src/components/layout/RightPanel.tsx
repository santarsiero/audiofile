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

import { useState } from 'react';
import { useStore } from '@/store';
import { labelApi } from '@/services/labelApi';
import type { LabelId, SongId } from '@/types/entities';

export function RightPanel() {
  const contentType = useStore((state) => state.right.contentType);
  const closePanel = useStore((state) => state.closePanel);

  return (
    <aside className="w-80 h-full min-h-0 flex flex-col bg-panel-light dark:bg-panel-dark border-l border-gray-200 dark:border-gray-800">
      {/* Panel header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 bg-panel-light/95 dark:bg-panel-dark/95">
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
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4">
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
      return <LabelList />;
    case 'label-info':
      return <LabelInfo />;
    case 'superlabel-info':
      return <SuperLabelInfoPlaceholder />;
    case 'song-info':
      return <SongInfo />;
    case 'add-label':
      return <AddLabelForm />;
    case 'add-superlabel':
      return <AddSuperLabelPlaceholder />;
    default:
      return <LabelList />;
  }
}

// Placeholder components - will be replaced with real implementations

function LabelList() {
  const labelIds = useStore((state) => state.labelIds);
  const labelsById = useStore((state) => state.labelsById);
  const openPanel = useStore((state) => state.openPanel);

  const sortedLabels = labelIds
    .map((id) => labelsById[id])
    .filter(Boolean)
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, labelId: LabelId) => {
    event.dataTransfer.setData('application/x-audiofile-label', labelId);
    event.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="space-y-2">
      {sortedLabels.map((label) => (
        <div
          key={label.labelId}
          draggable
          onDragStart={(event) => handleDragStart(event, label.labelId)}
          onClick={() => openPanel('right', 'label-info', label.labelId)}
          className="cursor-pointer rounded-md border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/40 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900"
          title={label.name}
        >
          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {label.name}
          </div>
        </div>
      ))}
    </div>
  );
}

function LabelInfo() {
  const labelId = useStore((state) => state.right.entityId) as LabelId | null;
  const label = useStore((state) => (labelId ? state.labelsById[labelId] : undefined));

  if (!labelId || !label) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        <p className="text-sm">Label not found</p>
      </div>
    );
  }

  const isManualLabel = label.name === 'Manual';

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/40 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={label.name}>
            {label.name}
          </p>
          {isManualLabel && (
            <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full">
              Manual
            </span>
          )}
        </div>
      </div>
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

function SongInfo() {
  const songId = useStore((state) => state.right.entityId) as SongId | null;
  const song = useStore((state) => (songId ? state.songsById[songId] : undefined));
  const labelsBySongId = useStore((state) => state.labelsBySongId);
  const labelsById = useStore((state) => state.labelsById);

  if (!songId || !song) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
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
          {(labelsBySongId[songId] ?? []).map((labelId) => (
            <span
              key={labelId}
              className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full"
            >
              {labelsById[labelId]?.name ?? labelId}
            </span>
          ))}
          {(labelsBySongId[songId] ?? []).length === 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">No labels</span>
          )}
        </div>
      </div>
    </div>
  );
}

function AddLabelForm() {
  const addLabel = useStore((state) => state.addLabel);
  const setPanelContent = useStore((state) => state.setPanelContent);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {

      // TEMP[libraryId-coherence]: trace label creation call site (remove after Phase 11)
      console.log('TEMP[libraryId-coherence] RightPanel.AddLabelForm -> labelApi.create', {
        file: 'components/layout/RightPanel.tsx',
        fn: 'handleSubmit',
        activeLibraryIdAtCall: useStore.getState().activeLibraryId,
        labelName: name.trim(),
        stack: new Error().stack,
      });

      const created = await labelApi.create({ name: name.trim() });
      addLabel(created);
      setPanelContent('right', 'label-info', created.labelId);
      setName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full h-9 px-3 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting || !name.trim()}
        className="w-full px-3 py-2 text-sm rounded-md border border-blue-600 dark:border-blue-500 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
      >
        Create
      </button>
    </form>
  );
}

function AddSuperLabelPlaceholder() {
  return (
    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
      <p className="text-sm">Add super label form coming soon</p>
    </div>
  );
}
