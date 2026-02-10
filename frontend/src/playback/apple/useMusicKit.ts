import { useEffect, useMemo, useState } from 'react';

import type { PlaybackErrorCode } from '@/types/playback';

type UseMusicKitResult =
  | { status: 'disabled' }
  | { status: 'loading' }
  | { status: 'ready'; music: unknown }
  | { status: 'error'; error: PlaybackErrorCode | string };

declare global {
  interface Window {
    MusicKit?: {
      configure?: (config: unknown) => void;
      getInstance?: () => unknown;
    };
  }
}

const MUSIC_KIT_SCRIPT_SRC = 'https://js-cdn.music.apple.com/musickit/v1/musickit.js';

let musicKitScriptLoadPromise: Promise<void> | null = null;

function loadMusicKitScript(): Promise<void> {
  if (musicKitScriptLoadPromise) {
    return musicKitScriptLoadPromise;
  }

  musicKitScriptLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${MUSIC_KIT_SCRIPT_SRC}"]`
    );

    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }

      existing.addEventListener('load', () => {
        existing.dataset.loaded = 'true';
        resolve();
      });
      existing.addEventListener('error', () => reject(new Error('MusicKit script failed to load')));
      return;
    }

    const script = document.createElement('script');
    script.src = MUSIC_KIT_SCRIPT_SRC;
    script.async = true;

    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      resolve();
    });
    script.addEventListener('error', () => reject(new Error('MusicKit script failed to load')));

    document.head.appendChild(script);
  });

  return musicKitScriptLoadPromise;
}

export function useMusicKit(): UseMusicKitResult {
  const providerMode = import.meta.env.VITE_APPLE_PROVIDER_MODE;
  const isEnabled = providerMode === 'real';

  const [status, setStatus] = useState<UseMusicKitResult['status']>(
    isEnabled ? 'loading' : 'disabled'
  );
  const [error, setError] = useState<PlaybackErrorCode | string | null>(null);
  const [music, setMusic] = useState<unknown>(null);

  useEffect(() => {
    if (!isEnabled) {
      setStatus('disabled');
      setError(null);
      setMusic(null);
      return;
    }

    let cancelled = false;

    async function init(): Promise<void> {
      setStatus('loading');
      setError(null);
      setMusic(null);

      try {
        await loadMusicKitScript();

        if (cancelled) return;

        if (!window.MusicKit?.configure || !window.MusicKit?.getInstance) {
          setStatus('error');
          setError('UNAVAILABLE');
          return;
        }

        const developerToken = import.meta.env.VITE_APPLE_MUSIC_DEVELOPER_TOKEN;
        const appName = import.meta.env.VITE_APPLE_MUSIC_APP_NAME || 'AudioFile';

        if (typeof developerToken !== 'string' || developerToken.trim().length === 0) {
          setStatus('error');
          setError('NOT_ENTITLED');
          return;
        }

        window.MusicKit.configure({
          developerToken: developerToken.trim(),
          app: {
            name: appName,
            build: '1.0.0',
          },
        });

        const instance = window.MusicKit.getInstance();

        if (cancelled) return;

        setMusic(instance);
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;

        setStatus('error');
        setError(err instanceof Error ? err.message : 'UNAVAILABLE');
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, [isEnabled]);

  return useMemo(() => {
    if (!isEnabled) {
      return { status: 'disabled' };
    }

    if (status === 'error') {
      return { status: 'error', error: error ?? 'UNAVAILABLE' };
    }

    if (status === 'ready') {
      return { status: 'ready', music };
    }

    return { status: 'loading' };
  }, [error, isEnabled, music, status]);
}
