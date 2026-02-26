/**
 * AudioFile Song Card Component
 * 
 * Renders a song card on the canvas.
 * 
 * Card content (MVP):
 * - Album artwork
 * - Primary name: Nickname (if exists) OR official title
 * - Subtext: Artist name
 * 
 * From Frontend MVP Source of Truth:
 * - Icons shown in mockups are non-functional placeholders (excluded)
 * - Labels/superlabels are NOT displayed directly on song cards (intentional minimalism)
 */

import { useEffect, useState, type MouseEvent as ReactMouseEvent } from 'react';

import { usePlayback } from '@/context/playback';
import { useStore } from '@/store';
import type { HydratedSongCanvasItem } from '@/types/canvas';

interface SongCardProps {
  item: HydratedSongCanvasItem;
}

export function SongCard({ item }: SongCardProps) {
  const { state } = usePlayback();
  const openPanel = useStore((s) => s.openPanel);
  const song = item.entity;

  const [hasArtError, setHasArtError] = useState(false);

  useEffect(() => {
    setHasArtError(false);
  }, [song.albumArtUrl]);

  const primaryText = song.nickname || song.displayTitle;
  const secondaryText = song.displayArtist;

  const isActive = state.currentSongId === song.songId;
  const isPlaying = isActive && state.status === 'playing';

  const handleDoubleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    openPanel('left', 'song-info', song.songId);
  };

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={`
        song-card w-[180px] h-[220px] p-3 cursor-pointer
        ${isActive ? 'ring-2 ring-neutral-400 bg-neutral-700/20' : ''}
        ${item.isSelected ? 'selected' : ''}
      `}
    >
      {/* Album artwork */}
      <div className="w-full aspect-square mb-3 bg-neutral-800 rounded-af-md overflow-hidden">
        {song.albumArtUrl && !hasArtError ? (
          <img
            src={song.albumArtUrl}
            alt={`${primaryText} album art`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setHasArtError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-600">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        )}
      </div>
      
      {/* Song info */}
      <div className="space-y-0.5">
        <h3 className="text-sm font-medium text-neutral-100 truncate" title={primaryText}>
          <span className="inline-flex items-center gap-2">
            {isPlaying ? (
              <span className="text-xs font-semibold text-neutral-400">
                Playing
              </span>
            ) : null}
            {primaryText}
          </span>
        </h3>
        <p className="text-xs text-neutral-500 truncate" title={secondaryText}>
          {secondaryText}
        </p>
      </div>
    </div>
  );
}
