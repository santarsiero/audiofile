import { createSongCanvasItem, DEFAULT_POSITION } from '@/domain/canvasItems';
import { alphabeticalGridLayoutEngine } from '@/layout-engines';
import { useStore } from '@/store';
import type { AppStore } from '@/store';
import type { Label, LabelId, SongId, SuperLabel } from '@/types/entities';
import type { CanvasPosition, SongCanvasItem } from '@/types/canvas';
import type { PositionedItem } from '@/layout-engines';

/**
 * Phase 5 layout orchestration entry point.
 *
 * Step 2 scope (completed):
 * - Read canonical songs and active filters from the store
 * - Apply filter logic (including "All Songs" and super label expansion)
 * - Produce a deterministic list of song IDs only (no canvas mutations yet)
 *
 * Step 3 scope:
 * - Generate one canvas song instance per selected song
 * - Replace canvas items via setItems (no layout, overlapping positions are OK)
 *
 * Step 4 scope:
 * - Apply AlphabeticalGridLayoutEngine to the generated canvas items
 * - Update only positions (no new instances) and replace canvas items with layout output
 */
export function runCanvasLayoutPipeline(options?: { recordUndo?: boolean }): void {
  const { recordUndo = true } = options ?? {};
  const store = useStore.getState();
  const {
    songIds,
    songsByLabelId,
    superLabelsById,
    labelsById,
    songsById,
    activeLabelIds,
    allSongsActive,
    setItems,
    createSnapshot,
    pushUndoEntry,
    items,
    markRebuildStart,
    clearSelection,
  } = store;

  markRebuildStart();

  const songIdsToPlace = selectSongIdsForFilters({
    songIds,
    songsByLabelId,
    superLabelsById,
    activeLabelIds,
    allSongsActive,
  });

  const songInstances = createSongInstances(songIdsToPlace);
  const labelEntityMap = buildLabelEntityMap(labelsById, superLabelsById);
  const layoutResult = alphabeticalGridLayoutEngine(songInstances, undefined, {
    songs: songsById,
    labels: labelEntityMap,
  });

  const positionedItems = applyLayoutToItems(songInstances, layoutResult.items);
  const shouldRecordUndo = recordUndo && items.length > 0;
  const snapshot = shouldRecordUndo ? createSnapshot() : null;

  if (items.some((item) => item.isSelected)) {
    clearSelection();
  }

  setItems(positionedItems);

  if (snapshot) {
    pushUndoEntry({ action: 'rebuild', snapshot });
  }

}

type FilterTriggerState = Pick<AppStore, 'activeLabelIds' | 'allSongsActive'>;

let filterSubscriptionCleanup: (() => void) | null = null;

export function initializeCanvasLayoutPipelineTriggers(): void {
  if (filterSubscriptionCleanup) {
    return;
  }

  filterSubscriptionCleanup = useStore.subscribe(
    selectFilterTriggers,
    () => {
      runCanvasLayoutPipeline();
    },
    {
      equalityFn: areFilterTriggerStatesEqual,
    }
  );
}

interface FilterComputationContext {
  songIds: SongId[];
  songsByLabelId: Record<LabelId, SongId[]>;
  superLabelsById: Record<LabelId, SuperLabel | undefined>;
  activeLabelIds: LabelId[];
  allSongsActive: boolean;
}

function selectSongIdsForFilters({
  songIds,
  songsByLabelId,
  superLabelsById,
  activeLabelIds,
  allSongsActive,
}: FilterComputationContext): SongId[] {
  const hasActiveLabels = activeLabelIds.length > 0;
  if (!hasActiveLabels) {
    return allSongsActive ? [...songIds] : [];
  }

  const expandedLabelIds = expandLabelSelection(activeLabelIds, superLabelsById);
  if (expandedLabelIds.length === 0) {
    return [];
  }

  return intersectSongsByLabels(expandedLabelIds, songsByLabelId, songIds);
}

function expandLabelSelection(
  labelIds: LabelId[],
  superLabelsById: Record<LabelId, SuperLabel | undefined>
): LabelId[] {
  const expanded = new Set<LabelId>();

  labelIds.forEach((labelId) => {
    const superLabel = superLabelsById[labelId];
    if (superLabel) {
      superLabel.componentLabelIds.forEach((componentId) => expanded.add(componentId));
    } else {
      expanded.add(labelId);
    }
  });

  return Array.from(expanded);
}

function intersectSongsByLabels(
  labelIds: LabelId[],
  songsByLabelId: Record<LabelId, SongId[]>,
  canonicalSongIds: SongId[]
): SongId[] {
  const canonicalSet = new Set(canonicalSongIds);
  if (labelIds.length === 0) {
    return [];
  }

  const [firstLabel, ...remainingLabels] = labelIds;
  let intersection = new Set(songsByLabelId[firstLabel] ?? []);

  for (const labelId of remainingLabels) {
    const songsForLabel = new Set(songsByLabelId[labelId] ?? []);
    intersection = new Set([...intersection].filter((songId) => songsForLabel.has(songId)));

    if (intersection.size === 0) {
      break;
    }
  }

  const canonicalIntersection = canonicalSongIds.filter(
    (songId) => intersection.has(songId) && canonicalSet.has(songId)
  );

  return canonicalIntersection;
}

function applyLayoutToItems(
  items: SongCanvasItem[],
  layoutItems: PositionedItem[]
): SongCanvasItem[] {
  const itemMap = new Map(items.map((item) => [item.instanceId, item]));

  return layoutItems
    .map((layoutItem) => {
      const original = itemMap.get(layoutItem.instanceId);
      if (!original) return undefined;
      return {
        ...original,
        position: layoutItem.position,
      };
    })
    .filter((item): item is SongCanvasItem => Boolean(item));
}

function buildLabelEntityMap(
  labelsById: Record<LabelId, Label>,
  superLabelsById: Record<LabelId, SuperLabel>
): Record<LabelId, Label | SuperLabel> {
  return {
    ...labelsById,
    ...superLabelsById,
  };
}

function createSongInstances(songIds: SongId[]): SongCanvasItem[] {
  let nextZIndex = 1;

  return songIds.map((songId) => {
    const position: CanvasPosition = { ...DEFAULT_POSITION };
    const instance = createSongCanvasItem(songId, position, nextZIndex);
    nextZIndex += 1;
    return instance;
  });
}

function selectFilterTriggers(state: AppStore): FilterTriggerState {
  return {
    activeLabelIds: state.activeLabelIds,
    allSongsActive: state.allSongsActive,
  };
}

function areFilterTriggerStatesEqual(
  a: FilterTriggerState,
  b: FilterTriggerState
): boolean {
  if (a === b) return true;
  if (a.allSongsActive !== b.allSongsActive) return false;
  if (a.activeLabelIds.length !== b.activeLabelIds.length) return false;
  for (let i = 0; i < a.activeLabelIds.length; i += 1) {
    if (a.activeLabelIds[i] !== b.activeLabelIds[i]) {
      return false;
    }
  }
  return true;
}
