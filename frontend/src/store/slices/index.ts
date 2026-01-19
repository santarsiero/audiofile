/**
 * AudioFile Store Slices
 * 
 * Barrel file for all Zustand slices.
 */

export { createLibrarySlice } from './librarySlice';
export type { LibrarySlice } from './librarySlice';

export { createSongsSlice, selectAllSongs, selectSongById, selectSongsByIds, selectSongCount } from './songsSlice';
export type { SongsSlice } from './songsSlice';

export { 
  createLabelsSlice, 
  selectAllLabels, 
  selectAllSuperLabels, 
  selectLabelById,
  selectLabelsForSong,
  selectSongsWithLabel,
  selectSongHasLabel,
} from './labelsSlice';
export type { LabelsSlice } from './labelsSlice';

export { 
  createFiltersSlice, 
  selectIsFilterActive, 
  selectActiveFilterCount,
  selectHasActiveFilters,
} from './filtersSlice';
export type { FiltersSlice } from './filtersSlice';

export { createSettingsSlice } from './settingsSlice';
export type { SettingsSlice } from './settingsSlice';

export { 
  createCanvasSlice,
  selectAllCanvasItems,
  selectSelectedItems,
  selectItemByInstanceId,
  selectInstancesOfEntity,
  selectSongInstances,
  selectSongInstanceCount,
} from './canvasSlice';
export type { CanvasSlice } from './canvasSlice';

export { 
  createModesSlice,
  selectAllModes,
  selectActiveMode,
  selectVisibleLabelIds,
  selectIsLabelVisibleInMode,
} from './modesSlice';
export type { ModesSlice } from './modesSlice';

export { 
  createPanelsSlice,
  selectAnyPanelOpen,
  selectPanelEntityId,
  selectIsContentTypeOpen,
} from './panelsSlice';
export type { PanelsSlice } from './panelsSlice';
