import type { StateCreator } from 'zustand';

export interface AuthSlice {
  isAuthenticated: boolean;
  setAuthenticated: (isAuthenticated: boolean) => void;
  resetAuth: () => void;
}

const initialState = {
  isAuthenticated: false,
};

export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = (set) => ({
  ...initialState,

  setAuthenticated: (isAuthenticated) => {
    set({ isAuthenticated });
  },

  resetAuth: () => {
    set(initialState);
  },
});
