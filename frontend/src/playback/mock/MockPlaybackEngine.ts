import type { Dispatch } from 'react';

import type { PlaybackErrorCode, PlaybackEvent } from '@/types/playback';

type MockPlaybackEngine = {
  play: (songId: string) => void;
  pause: () => void;
  stop: () => void;
  seek: (seconds: number) => void;
  raiseError: (code: PlaybackErrorCode) => void;
};

export function createMockPlaybackEngine(dispatch: Dispatch<PlaybackEvent>): MockPlaybackEngine {
  return {
    play: (songId) => {
      if (songId === '__MOCK_ERROR__') {
        dispatch({ type: 'RAISE_ERROR', code: 'UNAVAILABLE' });
        return;
      }

      dispatch({ type: 'PLAY', songId });
    },
    pause: () => dispatch({ type: 'PAUSE' }),
    stop: () => dispatch({ type: 'STOP' }),
    seek: (seconds) => dispatch({ type: 'SEEK', seconds }),
    raiseError: (code) => dispatch({ type: 'RAISE_ERROR', code }),
  };
}
