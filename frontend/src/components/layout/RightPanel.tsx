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

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store';
import { labelApi } from '@/services/labelApi';
import * as libraryApi from '@/services/libraryApi';
import type { LabelId } from '@/types/entities';
import { BulkLabelImportModal } from '@/components/modals/BulkLabelImportModal';

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

  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();

  const sortedLabels = useMemo(() => {
    const base = labelIds
      .map((id) => labelsById[id])
      .filter(Boolean)
      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

    if (!normalizedQuery) return base;

    return base
      .filter((label) => label.name.toLowerCase().includes(normalizedQuery))
      .slice(0, 50);
  }, [labelIds, labelsById, normalizedQuery]);

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, labelId: LabelId) => {
    event.dataTransfer.setData('application/x-audiofile-label', labelId);
    event.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="space-y-3">
      <BulkLabelImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search labels in your library…"
        className="w-full h-9 px-3 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md"
      />

      <button
        type="button"
        onClick={() => setIsBulkImportOpen(true)}
        className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900"
      >
        Bulk Import Labels
      </button>

      {normalizedQuery.length > 0 && sortedLabels.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/30 py-6 text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">No matches found</p>
        </div>
      ) : (
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
      )}
    </div>
  );
}

function LabelInfo() {
  const labelId = useStore((state) => state.right.entityId) as LabelId | null;
  const label = useStore((state) => (labelId ? state.labelsById[labelId] : undefined));
  const activeLibraryId = useStore((state) => state.activeLibraryId);
  const setLibraryData = useStore((state) => state.setLibraryData);
  const setSongs = useStore((state) => state.setSongs);
  const setSongSources = useStore((state) => state.setSongSources);
  const setLabels = useStore((state) => state.setLabels);
  const setSongLabels = useStore((state) => state.setSongLabels);
  const setModes = useStore((state) => state.setModes);
  const setPanelContent = useStore((state) => state.setPanelContent);
  const removeAllInstancesOfEntity = useStore((state) => state.removeAllInstancesOfEntity);
  const removeFilter = useStore((state) => state.removeFilter);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteArmed, setIsDeleteArmed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftDescription, setDraftDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!labelId || !label) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        <p className="text-sm">Label not found</p>
      </div>
    );
  }

  const isManualLabel = label.name === 'Manual';

  const description = typeof (label as { description?: unknown }).description === 'string'
    ? (label as { description: string }).description
    : '';

  const metadataRaw = (label as { metadata?: unknown }).metadata;
  const metadata =
    metadataRaw && typeof metadataRaw === 'object' && !Array.isArray(metadataRaw)
      ? (metadataRaw as Record<string, unknown>)
      : null;

  const metadataEntries = metadata ? Object.entries(metadata).filter(([key]) => key.trim().length > 0) : [];

  const handleNamePillDragStart = (event: React.DragEvent<HTMLSpanElement>) => {
    event.dataTransfer.setData('application/x-audiofile-label', label.labelId);
    event.dataTransfer.setData('text/plain', `label:${label.labelId}`);
    event.dataTransfer.effectAllowed = 'copy';
  };

  useEffect(() => {
    if (isEditing) return;
    setDraftDescription(description);
  }, [description, isEditing]);

  const handleStartEdit = () => {
    setDraftDescription(description);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setDraftDescription(description);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!labelId) return;
    if (!activeLibraryId) {
      window.alert('No active library selected.');
      return;
    }

    setIsSaving(true);
    try {
      await labelApi.update(labelId, { description: draftDescription });

      const data = await libraryApi.bootstrapLibrary(activeLibraryId);
      setLibraryData(data.library);
      setSongs(data.songs ?? []);
      setSongSources(data.songSources ?? []);
      setLabels(data.labels ?? [], data.superLabels ?? []);
      setSongLabels(data.songLabels ?? []);
      setModes(data.labelModes ?? []);

      setIsEditing(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update label.';
      window.alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLabel = async () => {
    if (!labelId) return;
    if (isDeleting) return;

    if (!isDeleteArmed) {
      setIsDeleteArmed(true);
      window.setTimeout(() => setIsDeleteArmed(false), 2500);
      return;
    }

    setIsDeleteArmed(false);

    const confirmed = window.confirm(
      'Permanently delete this label from your library? This cannot be undone.'
    );
    if (!confirmed) return;

    if (!activeLibraryId) {
      window.alert('No active library selected.');
      return;
    }

    setIsDeleting(true);
    try {
      await labelApi.delete(labelId);

      removeAllInstancesOfEntity(labelId);
      removeFilter(labelId);

      const data = await libraryApi.bootstrapLibrary(activeLibraryId);
      setLibraryData(data.library);
      setSongs(data.songs ?? []);
      setSongSources(data.songSources ?? []);
      setLabels(data.labels ?? [], data.superLabels ?? []);
      setSongLabels(data.songLabels ?? []);
      setModes(data.labelModes ?? []);

      setPanelContent('right', 'label-list');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete label.';
      window.alert(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/40 p-3">
        <div className="mb-2">
          <span
            draggable
            onDragStart={handleNamePillDragStart}
            className="inline-flex items-center px-3 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 cursor-grab active:cursor-grabbing"
            title="Drag to canvas"
          >
            {label.name}
          </span>
        </div>
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
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Type
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
            {label.type}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/40 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Description
          </p>
          {!isEditing ? (
            <button
              type="button"
              onClick={handleStartEdit}
              disabled={isDeleting || isSaving}
              className="text-xs px-2 py-1 rounded-md border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-40"
            >
              Edit
            </button>
          ) : null}
        </div>

        {!isEditing ? (
          description.trim().length > 0 ? (
            <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words">
              {description}
            </p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No description</p>
          )
        ) : (
          <div className="space-y-2">
            <textarea
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md resize-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="px-3 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="px-3 py-1.5 text-sm rounded-md border border-blue-600 dark:border-blue-500 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
              >
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>

      {metadataEntries.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/40 p-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Metadata
          </p>
          <div className="space-y-2">
            {metadataEntries.map(([key, value]) => {
              const displayValue =
                value === null || value === undefined
                  ? ''
                  : typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
                    ? String(value)
                    : Array.isArray(value)
                      ? value
                          .map((v) =>
                            typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
                              ? String(v)
                              : '[object]'
                          )
                          .join(', ')
                      : '[object]';

              return (
                <div key={key} className="grid grid-cols-[120px_1fr] gap-3">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 truncate" title={key}>
                    {key}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-200 break-words">
                    {displayValue}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/40 p-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Timestamps
        </p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">Created</span>
            <span className="text-xs text-gray-700 dark:text-gray-200 truncate" title={label.createdAt}>
              {label.createdAt}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">Updated</span>
            <span className="text-xs text-gray-700 dark:text-gray-200 truncate" title={label.updatedAt}>
              {label.updatedAt}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={isDeleting || isManualLabel}
        className={`w-full px-3 py-2 text-sm rounded-md border border-red-600 dark:border-red-500 bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 ${
          isDeleteArmed ? 'ring-2 ring-red-400 ring-offset-2 ring-offset-panel-light dark:ring-offset-panel-dark' : ''
        } ${(isDeleting || isManualLabel) ? 'opacity-60 cursor-not-allowed' : ''}`}
        onClick={() => void handleDeleteLabel()}
      >
        {isManualLabel
          ? 'Manual label cannot be deleted'
          : isDeleting
            ? 'Deleting…'
            : isDeleteArmed
              ? 'Click again to permanently delete'
              : 'Delete Label (Permanent)'}
      </button>
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
