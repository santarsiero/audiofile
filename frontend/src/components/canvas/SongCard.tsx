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

import { useCallback, type MouseEvent } from 'react';
import { useStore } from '@/store';
import type { HydratedSongCanvasItem } from '@/types/canvas';

interface SongCardProps {
  item: HydratedSongCanvasItem;
}

export function SongCard({ item }: SongCardProps) {
  const clickBehavior = useStore((state) => state.clickBehavior);
  const openPanel = useStore((state) => state.openPanel);
  const toggleInstanceSelection = useStore((state) => state.toggleInstanceSelection);
  const bringInstanceToFront = useStore((state) => state.bringInstanceToFront);
  
  const song = item.entity;
  
  // Determine display text
  const primaryText = song.nickname || song.displayTitle;
  const secondaryText = song.displayArtist;
  
  // Handle click based on click behavior setting
  const handleClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    
    if (clickBehavior === 'single-click') {
      // Single click opens info panel
      openPanel('right', 'song-info', song.songId);
    } else {
      // Double-click mode: single click selects
      toggleInstanceSelection(item.instanceId);
    }
    
    // Bring to front on any click
    bringInstanceToFront(item.instanceId);
  }, [clickBehavior, openPanel, song.songId, toggleInstanceSelection, item.instanceId, bringInstanceToFront]);
  
  // Handle double click (only in double-click mode)
  const handleDoubleClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    
    if (clickBehavior === 'double-click') {
      openPanel('right', 'song-info', song.songId);
    }
  }, [clickBehavior, openPanel, song.songId]);

  return (
    <div
      className={`
        song-card w-[180px] h-[220px] p-3 cursor-pointer
        ${item.isSelected ? 'selected' : ''}
      `}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
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
          {primaryText}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={secondaryText}>
          {secondaryText}
        </p>
      </div>
    </div>
  );
}
