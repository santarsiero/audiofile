/**
 * AudioFile Canvas Component
 * 
 * The infinite, freeform workspace (Microsoft Whiteboard-like).
 * 
 * Features:
 * - Pan freely (click and drag empty canvas)
 * - Zoom in/out
 * - Place items anywhere
 * - Render song cards and label pills
 * 
 * ARCHITECTURAL RULE:
 * Canvas receives pre-computed layout results from the store.
 * It does NOT compute layout itself - that's the layout layer's job.
 */

import { useRef, useCallback, useState, type MouseEvent } from 'react';
import { useStore } from '@/store';
import type { HydratedCanvasItem } from '@/types/canvas';
import { SongCard } from './SongCard';

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Canvas state from store
  const items = useStore((state) => state.items);
  const viewport = useStore((state) => state.viewport);
  const pan = useStore((state) => state.pan);
  const zoomIn = useStore((state) => state.zoomIn);
  const zoomOut = useStore((state) => state.zoomOut);
  
  // Entity data for hydration
  const songsById = useStore((state) => state.songsById);
  
  // Local pan state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Handle pan start
  const handleMouseDown = useCallback((e: MouseEvent) => {
    // Only pan on left click, not on items
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('.canvas-item')) return;
    
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  }, []);

  // Handle pan move
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanning) return;
    
    const deltaX = e.clientX - panStart.x;
    const deltaY = e.clientY - panStart.y;
    
    pan(deltaX, deltaY);
    setPanStart({ x: e.clientX, y: e.clientY });
  }, [isPanning, panStart, pan]);

  // Handle pan end
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomIn();
      } else {
        zoomOut();
      }
    }
  }, [zoomIn, zoomOut]);

  // Hydrate canvas items with entity data
  const hydratedItems = items.map((item) => {
    if (item.type === 'song') {
      const song = songsById[item.entityId];
      return song ? { ...item, entity: song } : null;
    }
    // Labels would be hydrated similarly
    return item;
  }).filter(Boolean) as HydratedCanvasItem[];

  return (
    <div
      ref={containerRef}
      className="canvas-container h-full w-full"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
    >
      <div
        ref={canvasRef}
        className="absolute origin-top-left"
        style={{
          transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`,
        }}
      >
        {/* Render canvas items */}
        {hydratedItems.map((item) => (
          <CanvasItemRenderer key={item.instanceId} item={item} />
        ))}
        
        {/* Empty state */}
        {items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center min-h-[400px] min-w-[600px]">
            <div className="text-center text-gray-400 dark:text-gray-600">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <h3 className="text-lg font-medium mb-1">No songs on canvas</h3>
              <p className="text-sm">Add songs to start organizing your library</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Canvas Item Renderer
 * Routes to appropriate component based on item type
 */
function CanvasItemRenderer({ item }: { item: HydratedCanvasItem }) {
  switch (item.type) {
    case 'song':
      return (
        <div
          className="canvas-item absolute"
          style={{
            left: item.position.x,
            top: item.position.y,
            zIndex: item.zIndex,
          }}
        >
          <SongCard item={item} />
        </div>
      );
    
    case 'label':
    case 'superlabel':
      // Label pill rendering - placeholder for now
      return (
        <div
          className="canvas-item absolute"
          style={{
            left: item.position.x,
            top: item.position.y,
            zIndex: item.zIndex,
          }}
        >
          <div className="label-pill">
            Label: {item.entityId}
          </div>
        </div>
      );
    
    default:
      return null;
  }
}
