/**
 * AudioFile Labels State Slice
 * 
 * Manages canonical label and super label entities from backend.
 * Also tracks song-label relationships.
 * 
 * ARCHITECTURAL RULE: This is the DATA LAYER state.
 * Labels are stored as maps by ID for O(1) lookup.
 */

import type { StateCreator } from 'zustand';
import type { 
  Label, 
  SuperLabel, 
  LabelId, 
  SongId, 
  SongLabel,
  RegularLabel,
} from '@/types/entities';

// =============================================================================
// TYPES
// =============================================================================

export interface LabelsSlice {
  // Regular labels
  labelsById: Record<LabelId, Label>;
  labelIds: LabelId[];
  
  // Super labels
  superLabelsById: Record<LabelId, SuperLabel>;
  superLabelIds: LabelId[];
  
  // Song-Label relationships
  songLabels: SongLabel[];
  /** Lookup: songId -> labelIds */
  labelsBySongId: Record<SongId, LabelId[]>;
  /** Lookup: labelId -> songIds */
  songsByLabelId: Record<LabelId, SongId[]>;
  
  // Loading state
  isLoadingLabels: boolean;
  labelsError: string | null;
  
  // Actions
  setLabels: (labels: Label[], superLabels: SuperLabel[]) => void;
  setSongLabels: (songLabels: SongLabel[]) => void;
  addLabel: (label: Label) => void;
  addSuperLabel: (superLabel: SuperLabel) => void;
  updateLabel: (labelId: LabelId, updates: Partial<Label>) => void;
  removeLabel: (labelId: LabelId) => void;
  addSongLabel: (songId: SongId, labelId: LabelId) => void;
  removeSongLabel: (songId: SongId, labelId: LabelId) => void;
  setLoadingLabels: (isLoading: boolean) => void;
  setLabelsError: (error: string | null) => void;
  resetLabels: () => void;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState = {
  labelsById: {} as Record<LabelId, Label>,
  labelIds: [] as LabelId[],
  superLabelsById: {} as Record<LabelId, SuperLabel>,
  superLabelIds: [] as LabelId[],
  songLabels: [] as SongLabel[],
  labelsBySongId: {} as Record<SongId, LabelId[]>,
  songsByLabelId: {} as Record<LabelId, SongId[]>,
  isLoadingLabels: false,
  labelsError: null,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Build lookup maps from song-label relationships
 */
function buildSongLabelMaps(songLabels: SongLabel[]): {
  labelsBySongId: Record<SongId, LabelId[]>;
  songsByLabelId: Record<LabelId, SongId[]>;
} {
  const labelsBySongId: Record<SongId, LabelId[]> = {};
  const songsByLabelId: Record<LabelId, SongId[]> = {};
  
  songLabels.forEach(({ songId, labelId }) => {
    // Add to labelsBySongId
    if (!labelsBySongId[songId]) {
      labelsBySongId[songId] = [];
    }
    if (!labelsBySongId[songId].includes(labelId)) {
      labelsBySongId[songId].push(labelId);
    }
    
    // Add to songsByLabelId
    if (!songsByLabelId[labelId]) {
      songsByLabelId[labelId] = [];
    }
    if (!songsByLabelId[labelId].includes(songId)) {
      songsByLabelId[labelId].push(songId);
    }
  });
  
  return { labelsBySongId, songsByLabelId };
}

// =============================================================================
// SLICE CREATOR
// =============================================================================

export const createLabelsSlice: StateCreator<
  LabelsSlice,
  [],
  [],
  LabelsSlice
> = (set) => ({
  ...initialState,
  
  setLabels: (labels, superLabels) => {
    const labelsById: Record<LabelId, Label> = {};
    const labelIds: LabelId[] = [];
    const superLabelsById: Record<LabelId, SuperLabel> = {};
    const superLabelIds: LabelId[] = [];
    
    labels.forEach((label) => {
      labelsById[label.labelId] = label;
      labelIds.push(label.labelId);
    });
    
    superLabels.forEach((superLabel) => {
      superLabelsById[superLabel.labelId] = superLabel;
      superLabelIds.push(superLabel.labelId);
    });
    
    set({
      labelsById,
      labelIds,
      superLabelsById,
      superLabelIds,
      labelsError: null,
    });
  },
  
  setSongLabels: (songLabels) => {
    const maps = buildSongLabelMaps(songLabels);
    set({
      songLabels,
      ...maps,
    });
  },
  
  addLabel: (label) => {
    set((state) => ({
      labelsById: { ...state.labelsById, [label.labelId]: label },
      labelIds: [...state.labelIds, label.labelId],
    }));
  },
  
  addSuperLabel: (superLabel) => {
    set((state) => ({
      superLabelsById: { ...state.superLabelsById, [superLabel.labelId]: superLabel },
      superLabelIds: [...state.superLabelIds, superLabel.labelId],
    }));
  },
  
  updateLabel: (labelId, updates) => {
    set((state) => {
      // Check regular labels first
      if (state.labelsById[labelId]) {
        return {
          labelsById: {
            ...state.labelsById,
            [labelId]: { ...state.labelsById[labelId], ...updates },
          },
        };
      }
      // Check super labels
      if (state.superLabelsById[labelId]) {
        return {
          superLabelsById: {
            ...state.superLabelsById,
            [labelId]: { ...state.superLabelsById[labelId], ...updates } as SuperLabel,
          },
        };
      }
      return state;
    });
  },
  
  removeLabel: (labelId) => {
    set((state) => {
      // Remove from regular labels
      const { [labelId]: removedLabel, ...remainingLabels } = state.labelsById;
      // Remove from super labels
      const { [labelId]: removedSuper, ...remainingSuperLabels } = state.superLabelsById;
      
      // Remove song-label relationships for this label
      const updatedSongLabels = state.songLabels.filter(
        (sl) => sl.labelId !== labelId
      );
      const maps = buildSongLabelMaps(updatedSongLabels);
      
      return {
        labelsById: remainingLabels,
        labelIds: state.labelIds.filter((id) => id !== labelId),
        superLabelsById: remainingSuperLabels,
        superLabelIds: state.superLabelIds.filter((id) => id !== labelId),
        songLabels: updatedSongLabels,
        ...maps,
      };
    });
  },
  
  addSongLabel: (songId, labelId) => {
    set((state) => {
      // Check if relationship already exists
      const exists = state.songLabels.some(
        (sl) => sl.songId === songId && sl.labelId === labelId
      );
      if (exists) return state;
      
      const newSongLabel: SongLabel = {
        songId,
        labelId,
        libraryId: '', // Will be populated by actual data
      };
      
      const updatedSongLabels = [...state.songLabels, newSongLabel];
      const maps = buildSongLabelMaps(updatedSongLabels);
      
      return {
        songLabels: updatedSongLabels,
        ...maps,
      };
    });
  },
  
  removeSongLabel: (songId, labelId) => {
    set((state) => {
      const updatedSongLabels = state.songLabels.filter(
        (sl) => !(sl.songId === songId && sl.labelId === labelId)
      );
      const maps = buildSongLabelMaps(updatedSongLabels);
      
      return {
        songLabels: updatedSongLabels,
        ...maps,
      };
    });
  },
  
  setLoadingLabels: (isLoading) => {
    set({ isLoadingLabels: isLoading });
  },
  
  setLabelsError: (error) => {
    set({ labelsError: error, isLoadingLabels: false });
  },
  
  resetLabels: () => {
    set(initialState);
  },
});

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Get all regular labels as an array (unordered)
 */
export function selectAllLabels(state: LabelsSlice): Label[] {
  return state.labelIds.map((id) => state.labelsById[id]);
}

/**
 * Get all super labels as an array (unordered)
 */
export function selectAllSuperLabels(state: LabelsSlice): SuperLabel[] {
  return state.superLabelIds.map((id) => state.superLabelsById[id]);
}

/**
 * Get a label by ID (regular or super)
 */
export function selectLabelById(
  state: LabelsSlice,
  labelId: LabelId
): Label | SuperLabel | undefined {
  return state.labelsById[labelId] || state.superLabelsById[labelId];
}

/**
 * Get labels for a specific song
 */
export function selectLabelsForSong(
  state: LabelsSlice,
  songId: SongId
): Label[] {
  const labelIds = state.labelsBySongId[songId] || [];
  return labelIds
    .map((id) => state.labelsById[id])
    .filter((label): label is Label => label !== undefined);
}

/**
 * Get songs that have a specific label
 */
export function selectSongsWithLabel(
  state: LabelsSlice,
  labelId: LabelId
): SongId[] {
  return state.songsByLabelId[labelId] || [];
}

/**
 * Check if a song has a specific label
 */
export function selectSongHasLabel(
  state: LabelsSlice,
  songId: SongId,
  labelId: LabelId
): boolean {
  const labelIds = state.labelsBySongId[songId] || [];
  return labelIds.includes(labelId);
}
