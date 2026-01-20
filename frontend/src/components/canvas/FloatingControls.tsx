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
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
      {/* Zoom controls */}
      <div className="bg-panel-light dark:bg-panel-dark rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1">
        <button
          onClick={zoomIn}
          className="block w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          title="Zoom in"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-1">
          {zoomPercentage}%
        </div>
        
        <button
          onClick={zoomOut}
          className="block w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          title="Zoom out"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </button>
      </div>

      {/* Recenter button */}
      <button
        onClick={handleRecenter}
        className="w-8 h-8 flex items-center justify-center bg-panel-light dark:bg-panel-dark rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        title="Recenter canvas"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>

      {/* Undo button (only if enabled) */}
      {enableUndoCopyPaste && (
        <button
          onClick={handleUndo}
          className="w-8 h-8 flex items-center justify-center bg-panel-light dark:bg-panel-dark rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Undo (Ctrl+Z)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
      )}
    </div>
  );
}
