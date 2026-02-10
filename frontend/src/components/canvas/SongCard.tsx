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

import type { MouseEvent as ReactMouseEvent } from 'react';

import { usePlayback } from '@/context/playback';
import type { HydratedSongCanvasItem } from '@/types/canvas';

interface SongCardProps {
  item: HydratedSongCanvasItem;
}

export function SongCard({ item }: SongCardProps) {
  const { state, play } = usePlayback();
  const song = item.entity;

  const primaryText = song.nickname || song.displayTitle;
  const secondaryText = song.displayArtist;

  const isActive = state.currentSongId === song.songId;
  const isPlaying = isActive && state.status === 'playing';

  const handleDoubleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    play(song.songId);
  };

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={`
        song-card w-[180px] h-[220px] p-3 cursor-pointer
        ${isActive ? 'ring-2 ring-blue-500 bg-blue-500/5' : ''}
        ${item.isSelected ? 'selected' : ''}
      `}
    >
      {/* Album artwork */}
      <div className="w-full aspect-square mb-3 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
        {song.albumArtUrl ? (
          <img
            src={song.albumArtUrl}
            alt={`${primaryText} album art`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        )}
      </div>
      
      {/* Song info */}
      <div className="space-y-0.5">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate" title={primaryText}>
          <span className="inline-flex items-center gap-2">
            {isPlaying ? (
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Playing
              </span>
            ) : null}
            {primaryText}
          </span>
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={secondaryText}>
          {secondaryText}
        </p>
      </div>
    </div>
  );
}
