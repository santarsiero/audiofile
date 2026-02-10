import { usePlayback } from '@/context/playback';

export function PlaybackDock(): JSX.Element {
  const { state, play, pause, stop, seek } = usePlayback();

  const SEEK_SECONDS = 5;

  const nowPlayingText =
    state.currentSongId === null ? 'Nothing playing' : `Song: ${state.currentSongId}`;

  const statusText = state.status;

  const playPauseLabel = state.status === 'playing' ? 'Pause' : 'Play';
  const playPauseIcon = state.status === 'playing' ? '❚❚' : '▶';

  const canPlay = state.currentSongId !== null;
  const canPause = state.status === 'playing';
  const canSeek = state.currentSongId !== null;

  const handlePlayPause = () => {
    if (state.status === 'playing') {
      pause();
      return;
    }

    if (state.currentSongId === null) {
      return;
    }

    play(state.currentSongId);
  };

  const handleSeekBackward = () => {
    if (!canSeek) return;
    seek(Math.max(0, state.positionSeconds - SEEK_SECONDS));
  };

  const handleSeekForward = () => {
    if (!canSeek) return;
    seek(state.positionSeconds + SEEK_SECONDS);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm text-zinc-100">{nowPlayingText}</div>
          <div className="text-xs text-zinc-400">Status: {statusText}</div>
          {state.error ? (
            <div className="mt-1 text-xs text-red-400">Error: {state.error}</div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canSeek}
            onClick={handleSeekBackward}
            aria-label="Seek backward"
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-zinc-800 bg-zinc-900 text-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            «
          </button>

          <button
            type="button"
            disabled={state.status === 'playing' ? !canPause : !canPlay}
            onClick={handlePlayPause}
            aria-label={playPauseLabel}
            className="inline-flex h-9 w-12 items-center justify-center rounded border border-zinc-800 bg-zinc-900 text-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="text-sm">{playPauseIcon}</span>
          </button>

          <button
            type="button"
            onClick={stop}
            aria-label="Stop"
            className="inline-flex h-9 w-12 items-center justify-center rounded border border-zinc-800 bg-zinc-900 text-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            ■
          </button>

          <button
            type="button"
            disabled={!canSeek}
            onClick={handleSeekForward}
            aria-label="Seek forward"
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-zinc-800 bg-zinc-900 text-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            »
          </button>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <div className="text-xs text-zinc-400">Vol</div>
          <div className="h-2 w-24 rounded bg-zinc-800">
            <div className="h-2 w-12 rounded bg-zinc-600" />
          </div>
        </div>
      </div>

      <div className="h-1 w-full bg-zinc-800">
        <div className="h-1 w-0 bg-zinc-200" />
      </div>
    </div>
  );
}
