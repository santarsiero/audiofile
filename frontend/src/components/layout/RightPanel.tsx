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

import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useStore } from '@/store';
import { labelApi } from '@/services/labelApi';
import * as libraryApi from '@/services/libraryApi';
import type { LabelId } from '@/types/entities';
import { BulkLabelImportModal } from '@/components/modals/BulkLabelImportModal';
import { getLabelTintStyle } from '@/styles/labelCategoryTint';

export function RightPanel() {
  const contentType = useStore((state) => state.right.contentType);
  const closePanel = useStore((state) => state.closePanel);

  const isLabelList = contentType === 'label-list' || contentType === null;

  const GAP_PX = 8;
  const CONTENT_PADDING_PX = 32;
  const MIN_COL_PX = 140;
  const MAX_COLS = 6;

  const widthForColumns = (cols: number) =>
    cols * MIN_COL_PX + Math.max(0, cols - 1) * GAP_PX + CONTENT_PADDING_PX;

  const clampCols = (cols: number) => Math.max(1, Math.min(MAX_COLS, cols));

  const maxViewportWidth = () => Math.floor(window.innerWidth * (2 / 3));

  const snapWidth = (rawPanelWidth: number) => {
    const contentWidth = Math.max(0, rawPanelWidth - CONTENT_PADDING_PX);
    const perCol = MIN_COL_PX + GAP_PX;
    const approxCols = Math.max(1, Math.round((contentWidth + GAP_PX) / perCol));
    const cols = clampCols(approxCols);
    return {
      cols,
      width: Math.min(maxViewportWidth(), widthForColumns(cols)),
    };
  };

  const [panelWidth, setPanelWidth] = useState<number>(() => {
    const raw = window.localStorage.getItem('audiofile:rightPanelWidth');
    const parsed = raw ? Number(raw) : NaN;
    const initial = Number.isFinite(parsed) ? parsed : widthForColumns(2);
    return Math.min(maxViewportWidth(), initial);
  });

  const renderedWidth = isLabelList ? panelWidth : widthForColumns(2);

  const snapped = snapWidth(panelWidth);

  useEffect(() => {
    window.localStorage.setItem('audiofile:rightPanelWidth', String(panelWidth));
  }, [panelWidth]);

  useEffect(() => {
    if (!isLabelList) return;
    const next = snapWidth(panelWidth);
    if (next.width !== panelWidth) {
      setPanelWidth(next.width);
    }
  }, [isLabelList, panelWidth]);

  const handleResizeMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!isLabelList) return;

    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startWidth = panelWidth;

    const minOpenWidth = widthForColumns(1);
    const maxWidth = maxViewportWidth();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;

      const rawNext = Math.min(maxWidth, startWidth + delta);
      if (rawNext < minOpenWidth) {
        window.localStorage.setItem('audiofile:rightPanelWidth', String(widthForColumns(2)));
        closePanel('right');
        handleMouseUp();
        return;
      }

      const next = snapWidth(rawNext);
      setPanelWidth(next.width);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <aside
      className="h-full min-h-0 flex flex-col bg-surface-panel border-l border-neutral-750 relative"
      style={{ width: renderedWidth }}
    >
      {isLabelList ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize labels panel"
          onMouseDown={handleResizeMouseDown}
          className="absolute left-0 top-0 h-full w-2 cursor-col-resize group"
        >
          <div className="h-full w-px mx-auto bg-transparent group-hover:bg-neutral-700/80 transition-colors duration-af-fast" />
        </div>
      ) : null}
      {/* Panel header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-neutral-750 bg-surface-panel">
        <h2 className="text-sm font-semibold text-neutral-200">
          {getPanelTitle(contentType)}
        </h2>
        <button
          onClick={() => closePanel('right')}
          className="p-1 text-neutral-500 hover:text-neutral-300 rounded-af-sm transition-colors duration-af-fast"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Panel content */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4">
        <PanelContent contentType={contentType} labelColumns={snapped.cols} />
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

function PanelContent({
  contentType,
  labelColumns,
}: {
  contentType: string | null;
  labelColumns: number;
}) {
  switch (contentType) {
    case 'label-list':
      return <LabelList labelColumns={labelColumns} />;
    case 'label-info':
      return <LabelInfo />;
    case 'superlabel-info':
      return <SuperLabelInfoPlaceholder />;
    case 'add-label':
      return <AddLabelForm />;
    case 'add-superlabel':
      return <AddSuperLabelPlaceholder />;
    default:
      return <LabelList labelColumns={labelColumns} />;
  }
}

// Placeholder components - will be replaced with real implementations

function LabelList({ labelColumns }: { labelColumns: number }) {
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
        className="w-full h-9 px-3 text-sm bg-neutral-800 border border-neutral-750 rounded-af-md text-neutral-100 placeholder:text-neutral-600 focus:ring-1 focus:ring-neutral-600 focus:outline-none"
      />

      <button
        type="button"
        onClick={() => setIsBulkImportOpen(true)}
        className="w-full px-3 py-2 text-sm rounded-af-md border border-neutral-750 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors duration-af-fast"
      >
        Bulk Import Labels
      </button>

      {normalizedQuery.length > 0 && sortedLabels.length === 0 ? (
        <div className="rounded-af-md border border-dashed border-neutral-750 bg-neutral-900/30 py-6 text-center text-neutral-600">
          <p className="text-af-small">No matches found</p>
        </div>
      ) : (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${labelColumns}, minmax(0, 1fr))` }}
        >
          {sortedLabels.map((label) => (
            <div
              key={label.labelId}
              draggable
              onDragStart={(event) => handleDragStart(event, label.labelId)}
              onClick={() => openPanel('right', 'label-info', label.labelId)}
              className="cursor-pointer rounded-af-md border border-neutral-750 bg-surface-element px-2.5 py-2 hover:bg-neutral-800 transition-colors duration-af-fast"
              title={label.name}
              style={getLabelTintStyle(label)}
            >
              <div className="font-medium text-neutral-100 truncate text-[clamp(11px,1.05vw,14px)]">
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
      <div className="text-center text-neutral-600 py-8">
        <p className="text-af-small">Label not found</p>
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
      <div className="rounded-af-lg border border-neutral-750 bg-surface-element p-3">
        <div className="mb-2">
          <span
            draggable
            onDragStart={handleNamePillDragStart}
            className="inline-flex items-center px-3 py-1 text-af-xs rounded-af-pill bg-neutral-750 text-neutral-200 border border-neutral-700 cursor-grab active:cursor-grabbing"
            title="Drag to canvas"
            style={getLabelTintStyle(label)}
          >
            {label.name}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-af-body font-semibold text-neutral-100 truncate" title={label.name}>
            {label.name}
          </p>
          {isManualLabel && (
            <span className="px-2 py-0.5 text-af-xs bg-neutral-750 text-neutral-400 rounded-af-pill border border-neutral-700">
              Manual
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-af-label uppercase tracking-widest text-neutral-600">
            Type
          </span>
          <span className="text-af-xs px-2 py-0.5 rounded-af-pill bg-neutral-750 text-neutral-300 border border-neutral-700">
            {label.type}
          </span>
        </div>
      </div>

      <div className="rounded-af-lg border border-neutral-750 bg-surface-element p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-af-label uppercase tracking-widest text-neutral-600">
            Description
          </p>
          {!isEditing ? (
            <button
              type="button"
              onClick={handleStartEdit}
              disabled={isDeleting || isSaving}
              className="text-af-xs px-2 py-1 rounded-af-sm border border-neutral-750 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 disabled:opacity-40 transition-colors duration-af-fast"
            >
              Edit
            </button>
          ) : null}
        </div>

        {!isEditing ? (
          description.trim().length > 0 ? (
            <p className="text-af-body text-neutral-300 whitespace-pre-wrap break-words">
              {description}
            </p>
          ) : (
            <p className="text-af-body text-neutral-600">No description</p>
          )
        ) : (
          <div className="space-y-2">
            <textarea
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm bg-neutral-800 border border-neutral-750 rounded-af-md text-neutral-100 resize-none focus:ring-1 focus:ring-neutral-600 focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="px-3 py-1.5 text-sm rounded-af-md border border-neutral-750 text-neutral-400 hover:bg-neutral-800 disabled:opacity-40 transition-colors duration-af-fast"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="px-3 py-1.5 text-sm rounded-af-md bg-neutral-100 text-neutral-950 font-medium hover:bg-white disabled:opacity-40 transition-colors duration-af-fast"
              >
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>

      {metadataEntries.length > 0 && (
        <div className="rounded-af-lg border border-neutral-750 bg-surface-element p-3 space-y-2">
          <p className="text-af-label uppercase tracking-widest text-neutral-600">
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
                  <div className="text-af-xs font-medium text-neutral-500 truncate" title={key}>
                    {key}
                  </div>
                  <div className="text-af-body text-neutral-300 break-words">
                    {displayValue}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-af-lg border border-neutral-750 bg-surface-element p-3 space-y-2">
        <p className="text-af-label uppercase tracking-widest text-neutral-600">
          Timestamps
        </p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3">
            <span className="text-af-xs text-neutral-600">Created</span>
            <span className="text-af-xs text-neutral-400 truncate" title={label.createdAt}>
              {new Date(label.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-af-xs text-neutral-600">Updated</span>
            <span className="text-af-xs text-neutral-400 truncate" title={label.updatedAt}>
              {new Date(label.updatedAt).toLocaleString()}
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
    <div className="text-center text-neutral-600 py-8">
      <p className="text-af-small">Super label info for: {entityId || 'unknown'}</p>
      <p className="text-af-xs mt-2">Coming soon</p>
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
        <label className="block text-af-label uppercase tracking-widest text-neutral-600">
          Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full h-9 px-3 text-sm bg-neutral-800 border border-neutral-750 rounded-af-md text-neutral-100 placeholder:text-neutral-600 focus:ring-1 focus:ring-neutral-600 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting || !name.trim()}
        className="w-full px-3 py-2 text-sm rounded-af-md bg-neutral-100 text-neutral-950 font-medium hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-af-fast"
      >
        Create
      </button>
    </form>
  );
}

function AddSuperLabelPlaceholder() {
  return (
    <div className="text-center text-neutral-600 py-8">
      <p className="text-af-small">Add super label form coming soon</p>
    </div>
  );
}
