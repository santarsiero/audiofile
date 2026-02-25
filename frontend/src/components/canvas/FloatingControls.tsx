/**
 * AudioFile Floating Controls Component
 * 
 * Floating UI on the right side of canvas with:
 * - Zoom In / Zoom Out
 * - Recenter
 * - Undo
 * 
 * From Frontend MVP Source of Truth:
 * - Toggle visibility via clicking empty canvas
 * - Always visible when canvas is active (MVP default: always visible)
 */

import { useState } from 'react';
import { useStore } from '@/store';
import { runCanvasLayoutPipeline } from '@/orchestrators/runCanvasLayoutPipeline';

export function FloatingControls() {
  const [isVisible, _setIsVisible] = useState(true);
  
  const viewport = useStore((state) => state.viewport);
  const zoomIn = useStore((state) => state.zoomIn);
  const zoomOut = useStore((state) => state.zoomOut);
  const resetZoom = useStore((state) => state.resetZoom);
  const resetPan = useStore((state) => state.resetPan);
  const enableUndoCopyPaste = useStore((state) => state.enableUndoCopyPaste);

  // Recenter: reset pan and zoom
  const handleRecenter = () => {
    resetPan();
    resetZoom();
    runCanvasLayoutPipeline();
  };

  // Undo placeholder
  const handleUndo = () => {
    // TODO: Implement undo from undo stack
    console.log('Undo action');
  };

  if (!isVisible) {
    return null;
  }

  const zoomPercentage = Math.round(viewport.zoom * 100);

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2">
      <div className="flex flex-col bg-neutral-850 rounded-af-lg shadow-af-float border border-neutral-750 overflow-hidden">
        {/* Zoom in */}
        <button
          onClick={zoomIn}
          className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors duration-af-fast"
          title="Zoom in"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>

        {/* Zoom percentage */}
        <div className="text-center text-af-xs text-neutral-600 py-0.5 tabular-nums">
          {zoomPercentage}%
        </div>

        {/* Zoom out */}
        <button
          onClick={zoomOut}
          className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors duration-af-fast"
          title="Zoom out"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </button>

        {/* Divider */}
        <div className="mx-1.5 border-t border-neutral-750" />

        {/* Recenter */}
        <button
          onClick={handleRecenter}
          className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors duration-af-fast"
          title="Recenter canvas"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>

        {/* Undo (only if enabled) */}
        {enableUndoCopyPaste && (
          <>
            <div className="mx-1.5 border-t border-neutral-750" />
            <button
              onClick={handleUndo}
              className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors duration-af-fast"
              title="Undo (Ctrl+Z)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
