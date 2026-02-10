export type PlaybackStatus = 'stopped' | 'playing' | 'paused';

export type PlaybackErrorCode =
  | 'UNAVAILABLE'
  | 'REGION_LOCKED'
  | 'NOT_ENTITLED'
  | 'NETWORK_ERROR';

export type PlaybackState =
  | {
      status: 'stopped';
      currentSongId: null;
      positionSeconds: 0;
      error: PlaybackErrorCode | null;
    }
  | {
      status: 'playing';
      currentSongId: string;
      positionSeconds: number;
      error: null;
    }
  | {
      status: 'paused';
      currentSongId: string;
      positionSeconds: number;
      error: null;
    };

export type PlaybackEvent =
  | { type: 'PLAY'; songId: string }
  | { type: 'PAUSE' }
  | { type: 'STOP' }
  | { type: 'SEEK'; seconds: number }
  | { type: 'RAISE_ERROR'; code: PlaybackErrorCode };

function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}

export function transitionPlaybackState(
  state: PlaybackState,
  event: PlaybackEvent
): PlaybackState {
  switch (state.status) {
    case 'stopped': {
      switch (event.type) {
        case 'PLAY':
          return {
            status: 'playing',
            currentSongId: event.songId,
            positionSeconds: 0,
            error: null,
          };
        case 'PAUSE':
          return state;
        case 'STOP':
          return state;
        case 'SEEK':
          return state;
        case 'RAISE_ERROR':
          return {
            status: 'stopped',
            currentSongId: null,
            positionSeconds: 0,
            error: event.code,
          };
        default:
          return assertNever(event);
      }
    }

    case 'playing': {
      switch (event.type) {
        case 'PLAY':
          return {
            status: 'playing',
            currentSongId: event.songId,
            positionSeconds: 0,
            error: null,
          };
        case 'PAUSE':
          return {
            status: 'paused',
            currentSongId: state.currentSongId,
            positionSeconds: state.positionSeconds,
            error: null,
          };
        case 'STOP':
          return {
            status: 'stopped',
            currentSongId: null,
            positionSeconds: 0,
            error: null,
          };
        case 'SEEK':
          return {
            status: 'playing',
            currentSongId: state.currentSongId,
            positionSeconds: Math.max(0, event.seconds),
            error: null,
          };
        case 'RAISE_ERROR':
          return {
            status: 'stopped',
            currentSongId: null,
            positionSeconds: 0,
            error: event.code,
          };
        default:
          return assertNever(event);
      }
    }

    case 'paused': {
      switch (event.type) {
        case 'PLAY':
          return {
            status: 'playing',
            currentSongId: event.songId,
            positionSeconds: 0,
            error: null,
          };
        case 'PAUSE':
          return state;
        case 'STOP':
          return {
            status: 'stopped',
            currentSongId: null,
            positionSeconds: 0,
            error: null,
          };
        case 'SEEK':
          return {
            status: 'paused',
            currentSongId: state.currentSongId,
            positionSeconds: Math.max(0, event.seconds),
            error: null,
          };
        case 'RAISE_ERROR':
          return {
            status: 'stopped',
            currentSongId: null,
            positionSeconds: 0,
            error: event.code,
          };
        default:
          return assertNever(event);
      }
    }

    default:
      return assertNever(state);
  }
}
