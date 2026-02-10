import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

import { createMockPlaybackEngine } from '@/playback/mock/MockPlaybackEngine';
import {
  transitionPlaybackState,
  type PlaybackState,
  type PlaybackEvent,
  type PlaybackErrorCode,
} from '@/types/playback';

type PlaybackContextValue = {
  state: PlaybackState;
  play: (songId: string) => void;
  pause: () => void;
  stop: () => void;
  seek: (seconds: number) => void;
  raiseError: (code: PlaybackErrorCode) => void;
};

const PlaybackContext = createContext<PlaybackContextValue | undefined>(undefined);

const initialPlaybackState: PlaybackState = {
  status: 'stopped',
  currentSongId: null,
  positionSeconds: 0,
  error: null,
};

function playbackReducer(state: PlaybackState, event: PlaybackEvent): PlaybackState {
  return transitionPlaybackState(state, event);
}

const PLAYBACK_MODE = 'mock' as const;

export function PlaybackProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, dispatch] = useReducer(playbackReducer, initialPlaybackState);

  const mockEngine = useMemo(() => {
    return createMockPlaybackEngine(dispatch);
  }, [dispatch]);

  const value = useMemo<PlaybackContextValue>(() => {
    if (PLAYBACK_MODE !== 'mock') {
      throw new Error('PlaybackProvider is configured without a playback engine.');
    }

    return {
      state,
      play: (songId) => mockEngine.play(songId),
      pause: () => mockEngine.pause(),
      stop: () => mockEngine.stop(),
      seek: (seconds) => mockEngine.seek(seconds),
      raiseError: (code) => mockEngine.raiseError(code),
    };
  }, [mockEngine, state]);

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
}

export function usePlayback(): PlaybackContextValue {
  const context = useContext(PlaybackContext);
  if (!context) {
    throw new Error(
      'usePlayback must be used within a PlaybackProvider. Wrap your component tree with <PlaybackProvider>. '
    );
  }

  return context;
}
