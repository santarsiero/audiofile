import type { StateCreator } from 'zustand';
import type { SongSource } from '@/types/entities';

export interface SongSourcesSlice {
  songSources: SongSource[];
  setSongSources: (sources: SongSource[]) => void;
  resetSongSources: () => void;
}

const initialState = {
  songSources: [] as SongSource[],
};

export const createSongSourcesSlice: StateCreator<
  SongSourcesSlice,
  [],
  [],
  SongSourcesSlice
> = (set) => ({
  ...initialState,

  setSongSources: (sources) => {
    set({ songSources: sources ?? [] });
  },

  resetSongSources: () => {
    set(initialState);
  },
});
