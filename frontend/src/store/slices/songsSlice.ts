/**
 * AudioFile Songs State Slice
 * 
 * Manages canonical song entities from backend.
 * 
 * ARCHITECTURAL RULE: This is the DATA LAYER state.
 * Songs are stored as a map by ID for O(1) lookup.
 * This slice does NOT handle ordering - that's the layout layer's job.
 */

import type { StateCreator } from 'zustand';
import type { Song, SongId } from '@/types/entities';

// =============================================================================
// TYPES
// =============================================================================

export interface SongsSlice {
  // State - using Map-like object for O(1) lookup
  songsById: Record<SongId, Song>;
  songIds: SongId[]; // Unordered list of IDs
  
  // Loading state
  isLoadingSongs: boolean;
  songsError: string | null;
  
  // Actions
  setSongs: (songs: Song[]) => void;
  addSong: (song: Song) => void;
  updateSong: (songId: SongId, updates: Partial<Song>) => void;
  removeSong: (songId: SongId) => void;
  setLoadingSongs: (isLoading: boolean) => void;
  setSongsError: (error: string | null) => void;
  resetSongs: () => void;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState = {
  songsById: {} as Record<SongId, Song>,
  songIds: [] as SongId[],
  isLoadingSongs: false,
  songsError: null,
};

// =============================================================================
// SLICE CREATOR
// =============================================================================

export const createSongsSlice: StateCreator<
  SongsSlice,
  [],
  [],
  SongsSlice
> = (set) => ({
  ...initialState,
  
  setSongs: (songs) => {
    const songsById: Record<SongId, Song> = {};
    const songIds: SongId[] = [];
    
    songs.forEach((song) => {
      songsById[song.songId] = song;
      songIds.push(song.songId);
    });
    
    set({ songsById, songIds, songsError: null });
  },
  
  addSong: (song) => {
    set((state) => ({
      songsById: { ...state.songsById, [song.songId]: song },
      songIds: [...state.songIds, song.songId],
    }));
  },
  
  updateSong: (songId, updates) => {
    set((state) => {
      const existingSong = state.songsById[songId];
      if (!existingSong) return state;
      
      return {
        songsById: {
          ...state.songsById,
          [songId]: { ...existingSong, ...updates },
        },
      };
    });
  },
  
  removeSong: (songId) => {
    set((state) => {
      const { [songId]: removed, ...remainingSongs } = state.songsById;
      return {
        songsById: remainingSongs,
        songIds: state.songIds.filter((id) => id !== songId),
      };
    });
  },
  
  setLoadingSongs: (isLoading) => {
    set({ isLoadingSongs: isLoading });
  },
  
  setSongsError: (error) => {
    set({ songsError: error, isLoadingSongs: false });
  },
  
  resetSongs: () => {
    set(initialState);
  },
});

// =============================================================================
// SELECTORS (Pure functions that derive data from state)
// =============================================================================

/**
 * Get all songs as an array (unordered)
 */
export function selectAllSongs(state: SongsSlice): Song[] {
  return state.songIds.map((id) => state.songsById[id]);
}

/**
 * Get a song by ID
 */
export function selectSongById(state: SongsSlice, songId: SongId): Song | undefined {
  return state.songsById[songId];
}

/**
 * Get songs by IDs
 */
export function selectSongsByIds(state: SongsSlice, songIds: SongId[]): Song[] {
  return songIds
    .map((id) => state.songsById[id])
    .filter((song): song is Song => song !== undefined);
}

/**
 * Get song count
 */
export function selectSongCount(state: SongsSlice): number {
  return state.songIds.length;
}
