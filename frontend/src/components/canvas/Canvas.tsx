/**
 * AudioFile Canvas Component
 * 
 * The infinite, freeform workspace (Microsoft Whiteboard-like).
 * 
 * Features:
 * - Pan freely (click and drag empty canvas)
 * - Zoom in/out
 * - Place items anywhere
 * - Render song cards and label pills
 * 
 * ARCHITECTURAL RULE:
 * Canvas receives pre-computed layout results from the store.
 * It does NOT compute layout itself - that's the layout layer's job.
 */

import {
  useRef,
  useCallback,
  useState,
  useEffect,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useStore } from '@/store';
import { labelApi } from '@/services/labelApi';
import type { SongId, LabelId } from '@/types/entities';
import type {
  CanvasSnapshot,
  LabelApplicationOperation,
} from '@/store/slices/canvasSlice';
import type {
  HydratedCanvasItem,
  HydratedSongCanvasItem,
  HydratedLabelCanvasItem,
  HydratedSuperLabelCanvasItem,
} from '@/types/canvas';
import { SongCard } from './SongCard';
import { FloatingControls } from './FloatingControls';

const SHOW_CANVAS_EMPTY_STATE = false;
const COPY_OFFSET = 24;
const DELETE_FEEDBACK_MS = 50;

const DND_SONG_MIME = 'application/x-audiofile-song';
const DND_LABEL_MIME = 'application/x-audiofile-label';

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const activeLibraryId = useStore((state) => state.activeLibraryId);
  
  // Canvas state from store
  const items = useStore((state) => state.items);
  const viewport = useStore((state) => state.viewport);
  const pan = useStore((state) => state.pan);
  const zoomIn = useStore((state) => state.zoomIn);
  const zoomOut = useStore((state) => state.zoomOut);
  const clearSelection = useStore((state) => state.clearSelection);
  const moveInstance = useStore((state) => state.moveInstance);
  const removeInstance = useStore((state) => state.removeInstance);
  const addSongInstance = useStore((state) => state.addSongInstance);
  const addLabelInstance = useStore((state) => state.addLabelInstance);
  const addSuperLabelInstance = useStore((state) => state.addSuperLabelInstance);
  const selectExclusiveInstance = useStore((state) => state.selectExclusiveInstance);
  const selectInstance = useStore((state) => state.selectInstance);
  const toggleInstanceSelection = useStore((state) => state.toggleInstanceSelection);
  const bringInstanceToFront = useStore((state) => state.bringInstanceToFront);
  const clickBehavior = useStore((state) => state.clickBehavior);
  const openPanel = useStore((state) => state.openPanel);
  const addSongLabel = useStore((state) => state.addSongLabel);
  const removeSongLabel = useStore((state) => state.removeSongLabel);
  const createSnapshot = useStore((state) => state.createSnapshot);
  const pushUndoEntry = useStore((state) => state.pushUndoEntry);
  const undo = useStore((state) => state.undo);
  const redo = useStore((state) => state.redo);
  const undoStackLength = useStore((state) => state.undoStack.length);
  const redoStackLength = useStore((state) => state.redoStack.length);
  const labelsBySongId = useStore((state) => state.labelsBySongId);

  // Entity data for hydration
  const songsById = useStore((state) => state.songsById);
  const labelsById = useStore((state) => state.labelsById);
  const superLabelsById = useStore((state) => state.superLabelsById);

  // Local pan state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [isDeleteFlashVisible, setIsDeleteFlashVisible] = useState(false);
  const deleteFlashTimeoutRef = useRef<number | null>(null);

  type DragItem = {
    instanceId: string;
    startX: number;
    startY: number;
  };

  type DragState = {
    pointerId: number;
    origin: { x: number; y: number };
    items: DragItem[];
    hasMoved: boolean;
    snapshot: CanvasSnapshot | null;
  };

  const dragStateRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);

  // Handle pan start
  const handleMouseDown = useCallback((e: ReactMouseEvent) => {
    // Only pan on left click, not on items
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('.canvas-item')) return;
    
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  }, []);

  // Handle pan move
  const handleMouseMove = useCallback((e: ReactMouseEvent) => {
    if (!isPanning) return;

    const deltaX = e.clientX - panStart.x;
    const deltaY = e.clientY - panStart.y;
    
    pan(deltaX, deltaY);
    setPanStart({ x: e.clientX, y: e.clientY });
  }, [isPanning, panStart, pan]);

  // Handle pan end
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomIn();
      } else {
        zoomOut();
      }
    }
  }, [zoomIn, zoomOut]);

  // Clear selection when clicking empty canvas space
  const handleCanvasClick = useCallback((e: ReactMouseEvent) => {
    if ((e.target as HTMLElement).closest('.canvas-item')) {
      return;
    }
    clearSelection();
  }, [clearSelection]);

  const handleWindowPointerMove = useCallback((event: PointerEvent) => {
    const dragState = dragStateRef.current;
    if (!dragState || event.pointerId !== dragState.pointerId) return;

    const deltaX = (event.clientX - dragState.origin.x) / viewport.zoom;
    const deltaY = (event.clientY - dragState.origin.y) / viewport.zoom;

    if (!dragState.hasMoved && (deltaX !== 0 || deltaY !== 0)) {
      dragState.hasMoved = true;
    }

    if (!dragState.hasMoved) return;

    dragState.items.forEach((dragItem) => {
      moveInstance(dragItem.instanceId, {
        x: dragItem.startX + deltaX,
        y: dragItem.startY + deltaY,
      });
    });
  }, [moveInstance, viewport.zoom]);

  const handleWindowPointerUp = useCallback(
    (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState || event.pointerId !== dragState.pointerId) return;

      if (dragState.hasMoved) {
        suppressClickRef.current = true;
        requestAnimationFrame(() => {
          suppressClickRef.current = false;
        });

        if (dragState.snapshot) {
          pushUndoEntry({ action: 'move', snapshot: dragState.snapshot });
        }
      }

      dragStateRef.current = null;
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
    },
    [handleWindowPointerMove, pushUndoEntry]
  );

  const cancelDrag = useCallback(() => {
    dragStateRef.current = null;
    window.removeEventListener('pointermove', handleWindowPointerMove);
    window.removeEventListener('pointerup', handleWindowPointerUp);
  }, [handleWindowPointerMove, handleWindowPointerUp]);

  // Hydrate canvas items with entity data
  const hydratedItems = items
    .map((item) => {
      switch (item.type) {
        case 'song': {
          const song = songsById[item.entityId];
          return song ? { ...item, entity: song } : null;
        }
        case 'label': {
          const label = labelsById[item.entityId];
          return label ? { ...item, entity: label } : null;
        }
        case 'superlabel': {
          const superLabel = superLabelsById[item.entityId];
          return superLabel ? { ...item, entity: superLabel } : null;
        }
        default:
          return null;
      }
    })
    .filter(Boolean) as HydratedCanvasItem[];

  useEffect(() => {
    // TEMP[libraryId-coherence]: trace canvas render counts under current activeLibraryId (remove after Phase 11)
    const songInstanceCount = hydratedItems.filter((item) => item.type === 'song').length;
    const labelInstanceCount = hydratedItems.filter((item) => item.type === 'label').length;
    const superLabelInstanceCount = hydratedItems.filter((item) => item.type === 'superlabel').length;
    console.log('TEMP[libraryId-coherence] Canvas render snapshot', {
      file: 'components/canvas/Canvas.tsx',
      fn: 'Canvas',
      activeLibraryIdAtRender: activeLibraryId,
      canonicalSongsCount: Object.keys(songsById).length,
      canonicalLabelsCount: Object.keys(labelsById).length,
      canonicalSuperLabelsCount: Object.keys(superLabelsById).length,
      hydratedTotalCount: hydratedItems.length,
      songInstanceCount,
      labelInstanceCount,
      superLabelInstanceCount,
    });
  }, [activeLibraryId, hydratedItems, songsById, labelsById, superLabelsById]);

  const selectedItems = hydratedItems.filter((item) => item.isSelected);
  const selectedSongItems = selectedItems.filter(
    (item): item is HydratedSongCanvasItem => item.type === 'song'
  );

  const applyLabelToSongs = useCallback(
    async (songIds: SongId[], labelId: LabelId, snapshot: CanvasSnapshot) => {
      const pendingOperations: LabelApplicationOperation[] = [];
      songIds.forEach((songId) => {
        const existingLabelIds = labelsBySongId[songId] ?? [];
        if (existingLabelIds.includes(labelId)) return;
        pendingOperations.push({ songId, labelId });
      });

      if (!pendingOperations.length) return;

      const results = await Promise.all(
        pendingOperations.map(async (operation) => {
          try {
            await labelApi.addToSong(operation.songId, operation.labelId);
            addSongLabel(operation.songId, operation.labelId);
            return operation;
          } catch (error) {
            console.error('Failed to apply label to song', {
              songId: operation.songId,
              labelId: operation.labelId,
              error,
            });
            return null;
          }
        })
      );

      const successfulOperations = results.filter(Boolean) as LabelApplicationOperation[];
      if (!successfulOperations.length) return;

      pushUndoEntry({
        action: 'apply-label',
        snapshot,
        meta: { labelApplications: successfulOperations },
      });
    },
    [addSongLabel, labelsBySongId, pushUndoEntry]
  );

  const getCanvasDropPosition = useCallback(
    (event: React.DragEvent, container: HTMLDivElement) => {
      const rect = container.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      return {
        x: (localX - viewport.panX) / viewport.zoom,
        y: (localY - viewport.panY) / viewport.zoom,
      };
    },
    [viewport.panX, viewport.panY, viewport.zoom]
  );

  const handleCanvasDragOver = useCallback((event: React.DragEvent) => {
    const types = event.dataTransfer.types;
    if (types.includes(DND_SONG_MIME) || types.includes(DND_LABEL_MIME)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleCanvasDrop = useCallback(
    async (event: React.DragEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const songId = event.dataTransfer.getData(DND_SONG_MIME) as SongId;
      const labelId = event.dataTransfer.getData(DND_LABEL_MIME) as LabelId;
      if (!songId && !labelId) return;

      event.preventDefault();

      const position = getCanvasDropPosition(event, container);
      const snapshot = createSnapshot();

      if (songId) {
        addSongInstance(songId, position);
        pushUndoEntry({ action: 'copy', snapshot });
        return;
      }

      if (labelId) {
        addLabelInstance(labelId, position);
        pushUndoEntry({ action: 'copy', snapshot });
      }
    },
    [
      addLabelInstance,
      addSongInstance,
      createSnapshot,
      getCanvasDropPosition,
      pushUndoEntry,
    ]
  );

  const handleSongDrop = useCallback(
    async (event: React.DragEvent, songId: SongId, instanceId: string) => {
      const labelId = event.dataTransfer.getData(DND_LABEL_MIME) as LabelId;
      if (!labelId) return;

      event.preventDefault();
      event.stopPropagation();

      const snapshot = createSnapshot();
      const selectedSongIds = selectedSongItems.map((item) => item.entity.songId);
      const shouldApplyToSelection =
        selectedSongItems.length > 1 && selectedSongItems.some((item) => item.instanceId === instanceId);

      const songIdsToApply = shouldApplyToSelection ? selectedSongIds : [songId];
      await applyLabelToSongs(songIdsToApply, labelId, snapshot);
    },
    [applyLabelToSongs, createSnapshot, selectedSongItems]
  );

  const handleSongDragOver = useCallback((event: React.DragEvent) => {
    if (event.dataTransfer.types.includes(DND_LABEL_MIME)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleItemPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, item: HydratedCanvasItem) => {
      if (event.button !== 0) return;

      if (event.shiftKey) {
        toggleInstanceSelection(item.instanceId);
        return;
      }

      cancelDrag();

      const selection = item.isSelected
        ? hydratedItems.filter((hydratedItem) => hydratedItem.isSelected)
        : [item];

      if (!item.isSelected) {
        selectExclusiveInstance(item.instanceId);
      }

      const snapshot = createSnapshot();

      dragStateRef.current = {
        pointerId: event.pointerId,
        origin: { x: event.clientX, y: event.clientY },
        items: selection.map((selected) => ({
          instanceId: selected.instanceId,
          startX: selected.position.x,
          startY: selected.position.y,
        })),
        hasMoved: false,
        snapshot,
      };

      bringInstanceToFront(item.instanceId);

      window.addEventListener('pointermove', handleWindowPointerMove);
      window.addEventListener('pointerup', handleWindowPointerUp);
    },
    [
      hydratedItems,
      toggleInstanceSelection,
      cancelDrag,
      selectExclusiveInstance,
      bringInstanceToFront,
      handleWindowPointerMove,
      handleWindowPointerUp,
      createSnapshot,
    ]
  );

  const openPanelForItem = useCallback(
    (item: HydratedCanvasItem) => {
      if (item.type === 'song') {
        openPanel('left', 'song-info', (item as HydratedSongCanvasItem).entity.songId);
      } else if (item.type === 'label') {
        openPanel('right', 'label-info', item.entityId);
      } else if (item.type === 'superlabel') {
        openPanel('right', 'superlabel-info', item.entityId);
      }
    },
    [openPanel]
  );

  const applyLabelToSelection = useCallback(
    async (labelItem: LabelCanvasInstance) => {
      if (!selectedSongItems.length) return;

      const labelIds =
        labelItem.type === 'label'
          ? [labelItem.entityId]
          : labelItem.entity.componentLabelIds ?? [];

      if (!labelIds.length) return;

      const pendingOperations: LabelApplicationOperation[] = [];

      selectedSongItems.forEach((songItem) => {
        const existingLabelIds = labelsBySongId[songItem.entity.songId] ?? [];

        labelIds.forEach((labelId) => {
          if (existingLabelIds.includes(labelId)) return;
          pendingOperations.push({ songId: songItem.entity.songId, labelId });
        });
      });

      if (!pendingOperations.length) return;

      const snapshot = createSnapshot();

      const results = await Promise.all(
        pendingOperations.map(async (operation) => {
          try {
            await labelApi.addToSong(operation.songId, operation.labelId);
            addSongLabel(operation.songId, operation.labelId);
            return operation;
          } catch (error) {
            console.error('Failed to apply label to song', {
              songId: operation.songId,
              labelId: operation.labelId,
              error,
            });
            return null;
          }
        })
      );

      const successfulOperations = results.filter(Boolean) as LabelApplicationOperation[];
      if (!successfulOperations.length) {
        return;
      }

      pushUndoEntry({
        action: 'apply-label',
        snapshot,
        meta: { labelApplications: successfulOperations },
      });
    },
    [
      selectedSongItems,
      labelsBySongId,
      addSongLabel,
      createSnapshot,
      pushUndoEntry,
    ]
  );

  const handleItemClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>, item: HydratedCanvasItem) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }

      if (event.shiftKey) {
        return;
      }

      if (selectedSongItems.length && item.type !== 'song') {
        void applyLabelToSelection(item as LabelCanvasInstance);
        return;
      }

      if (clickBehavior === 'single-click') {
        openPanelForItem(item);
      }
    },
    [clickBehavior, openPanelForItem, selectedSongItems.length, applyLabelToSelection]
  );

  const handleItemDoubleClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>, item: HydratedCanvasItem) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }

      event.stopPropagation();

      if (clickBehavior === 'double-click') {
        openPanelForItem(item);
      }
    },
    [clickBehavior, openPanelForItem]
  );

  useEffect(() => cancelDrag, [cancelDrag]);

  useEffect(() => {
    return () => {
      if (deleteFlashTimeoutRef.current !== null) {
        window.clearTimeout(deleteFlashTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!dragStateRef.current) return;
    const currentIds = new Set(items.map((item) => item.instanceId));
    const stillValid = dragStateRef.current.items.every((dragItem) => currentIds.has(dragItem.instanceId));
    if (!stillValid) {
      cancelDrag();
    }
  }, [items, cancelDrag]);

  const deleteSelectedInstances = useCallback(() => {
    if (!selectedItems.length) return;

    setIsDeleteFlashVisible(true);
    if (deleteFlashTimeoutRef.current !== null) {
      window.clearTimeout(deleteFlashTimeoutRef.current);
    }
    requestAnimationFrame(() => {
      deleteFlashTimeoutRef.current = window.setTimeout(() => {
        setIsDeleteFlashVisible(false);
        deleteFlashTimeoutRef.current = null;
      }, DELETE_FEEDBACK_MS);
    });

    const snapshot = createSnapshot();
    selectedItems.forEach((item) => removeInstance(item.instanceId));
    clearSelection();
    pushUndoEntry({ action: 'delete', snapshot });
  }, [selectedItems, createSnapshot, removeInstance, clearSelection, pushUndoEntry]);

  const handleCopySelection = useCallback(() => {
    if (!selectedItems.length) return;

    const snapshot = createSnapshot();
    const newInstanceIds = selectedItems.map((item) => {
      const position = {
        x: item.position.x + COPY_OFFSET,
        y: item.position.y + COPY_OFFSET,
      };

      switch (item.type) {
        case 'song':
          return addSongInstance(item.entityId, position);
        case 'label':
          return addLabelInstance(item.entityId, position);
        case 'superlabel':
          return addSuperLabelInstance(item.entityId, position);
        default:
          return null;
      }
    }).filter(Boolean) as string[];

    if (!newInstanceIds.length) return;

    clearSelection();
    newInstanceIds.forEach((instanceId) => selectInstance(instanceId));
    pushUndoEntry({ action: 'copy', snapshot });
  }, [
    selectedItems,
    addSongInstance,
    addLabelInstance,
    addSuperLabelInstance,
    clearSelection,
    selectInstance,
    createSnapshot,
    pushUndoEntry,
  ]);

  const processLabelOperations = useCallback(
    async (operations: LabelApplicationOperation[], direction: 'undo' | 'redo') => {
      await Promise.all(
        operations.map(async (operation) => {
          try {
            if (direction === 'undo') {
              await labelApi.removeFromSong(operation.songId, operation.labelId);
              removeSongLabel(operation.songId, operation.labelId);
            } else {
              await labelApi.addToSong(operation.songId, operation.labelId);
              addSongLabel(operation.songId, operation.labelId);
            }
          } catch (error) {
            console.error(`Failed to ${direction === 'undo' ? 'remove' : 'reapply'} label`, {
              songId: operation.songId,
              labelId: operation.labelId,
              error,
            });
          }
        })
      );
    },
    [addSongLabel, removeSongLabel]
  );

  const handleUndoAction = useCallback(async () => {
    const entry = undo();
    if (!entry) return;

    if (entry.action === 'apply-label' && entry.meta?.labelApplications?.length) {
      await processLabelOperations(entry.meta.labelApplications, 'undo');
    }
  }, [undo, processLabelOperations]);

  const handleRedoAction = useCallback(async () => {
    const entry = redo();
    if (!entry) return;

    if (entry.action === 'apply-label' && entry.meta?.labelApplications?.length) {
      await processLabelOperations(entry.meta.labelApplications, 'redo');
    }
  }, [redo, processLabelOperations]);

  return (
    <div className="relative h-full w-full">
      <div
        className={`pointer-events-none absolute inset-0 z-40 bg-white/10 opacity-0 transition-opacity ${
          isDeleteFlashVisible ? 'opacity-100' : ''
        }`}
        style={{ transitionDuration: `${DELETE_FEEDBACK_MS}ms` }}
      />
      <div
        ref={containerRef}
        className="canvas-container h-full w-full overflow-auto overscroll-contain"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
        onDragOver={handleCanvasDragOver}
        onDrop={(event) => void handleCanvasDrop(event)}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        <div
          ref={canvasRef}
          className="absolute origin-top-left"
          style={{
            transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`,
          }}
        >
          {/* Render canvas items */}
          {hydratedItems.map((item) => (
            <CanvasItemRenderer
              key={item.instanceId}
              item={item}
              onPointerDown={handleItemPointerDown}
              onClick={handleItemClick}
              onDoubleClick={handleItemDoubleClick}
              onDragOver={
                item.type === 'song'
                  ? (event) => handleSongDragOver(event)
                  : undefined
              }
              onDrop={
                item.type === 'song'
                  ? (event) => void handleSongDrop(event, (item as HydratedSongCanvasItem).entity.songId, item.instanceId)
                  : undefined
              }
            />
          ))}
          
          {/* Empty state */}
          {SHOW_CANVAS_EMPTY_STATE && items.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center min-h-[400px] min-w-[600px]">
              <div className="text-center text-gray-400 dark:text-gray-600">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <h3 className="text-lg font-medium mb-1">No songs on canvas</h3>
                <p className="text-sm">Add songs to start organizing your library</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating system controls anchored to the canvas area */}
      <FloatingControls />

      {/* Temporary action controls */}
      <div className="pointer-events-none absolute top-4 left-4 z-30 flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            className="pointer-events-auto px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white/90 dark:bg-gray-900/80 text-gray-700 dark:text-gray-200 disabled:opacity-40"
            onClick={() => void handleUndoAction()}
            disabled={undoStackLength === 0}
          >
            Undo
          </button>
          <button
            type="button"
            className="pointer-events-auto px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white/90 dark:bg-gray-900/80 text-gray-700 dark:text-gray-200 disabled:opacity-40"
            onClick={() => void handleRedoAction()}
            disabled={redoStackLength === 0}
          >
            Redo
          </button>
        </div>
        <button
          type="button"
          className="pointer-events-auto px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white/90 dark:bg-gray-900/80 text-gray-700 dark:text-gray-200 disabled:opacity-40"
          onClick={handleCopySelection}
          disabled={selectedItems.length === 0}
        >
          Copy
        </button>
        <button
          type="button"
          className="pointer-events-auto px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white/90 dark:bg-gray-900/80 text-gray-700 dark:text-gray-200 disabled:opacity-40"
          onClick={deleteSelectedInstances}
          disabled={selectedItems.length === 0}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

/**
 * Canvas Item Renderer
 * Routes to appropriate component based on item type
 */
type LabelCanvasInstance = HydratedLabelCanvasItem | HydratedSuperLabelCanvasItem;

interface CanvasItemRendererProps {
  item: HydratedCanvasItem;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>, item: HydratedCanvasItem) => void;
  onClick: (event: ReactMouseEvent<HTMLDivElement>, item: HydratedCanvasItem) => void;
  onDoubleClick: (event: ReactMouseEvent<HTMLDivElement>, item: HydratedCanvasItem) => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
}

function CanvasItemRenderer({ item, onPointerDown, onClick, onDoubleClick, onDragOver, onDrop }: CanvasItemRendererProps) {
  return (
    <div
      className="canvas-item absolute"
      style={{
        left: item.position.x,
        top: item.position.y,
        zIndex: item.zIndex,
      }}
      onPointerDown={(event) => onPointerDown(event, item)}
      onClick={(event) => onClick(event, item)}
      onDoubleClick={(event) => onDoubleClick(event, item)}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {item.type === 'song' ? (
        <SongCard item={item as HydratedSongCanvasItem} />
      ) : (
        <LabelCanvasVisual item={item as LabelCanvasInstance} />
      )}
    </div>
  );
}

function LabelCanvasVisual({ item }: { item: LabelCanvasInstance }) {
  const labelName = item.entity?.name ?? item.entityId;

  return (
    <div
      className={`label-pill ${item.type === 'superlabel' ? 'super' : ''} ${item.isSelected ? 'selected' : ''}`}
      title={labelName}
    >
      <span className="text-sm font-medium truncate max-w-[180px]">{labelName}</span>
    </div>
  );
}
