/**
 * AudioFile Library Page
 * 
 * Main workspace page (Workshop 1–5).
 * Contains the infinite canvas and floating controls.
 * 
 * This page:
 * - Bootstraps library data on mount
 * - Renders the canvas with song cards
 * - Shows floating controls (zoom, recenter, undo)
 */

import { useEffect, useRef } from 'react';
import { useStore } from '@/store';
import { Canvas } from '@/components/canvas/Canvas';
import * as libraryApi from '@/services/libraryApi';
import { runCanvasLayoutPipeline } from '@/orchestrators/runCanvasLayoutPipeline';

export function LibraryPage() {
  const hasInitializedCanvasRef = useRef(false);
  const hasInitializedLibraryRef = useRef(false);
  const {
    isBootstrapping,
    bootstrapError,
    activeLibraryId,
    setActiveLibrary,
    setLibraryData,
    setBootstrapping,
    setBootstrapped,
    setBootstrapError,
    setSongs,
    setLabels,
    setSongLabels,
    setModes,
  } = useStore((state) => ({
    isBootstrapping: state.isBootstrapping,
    bootstrapError: state.bootstrapError,
    activeLibraryId: state.activeLibraryId,
    setActiveLibrary: state.setActiveLibrary,
    setLibraryData: state.setLibraryData,
    setBootstrapping: state.setBootstrapping,
    setBootstrapped: state.setBootstrapped,
    setBootstrapError: state.setBootstrapError,
    setSongs: state.setSongs,
    setLabels: state.setLabels,
    setSongLabels: state.setSongLabels,
    setModes: state.setModes,
  }));

  // Bootstrap library on mount
  useEffect(() => {
    if (hasInitializedLibraryRef.current) {
      return;
    }

    hasInitializedLibraryRef.current = true;

    async function init() {
      setBootstrapping(true);
      setBootstrapError(null);

      try {
        const { libraries } = await libraryApi.listLibraries();

        const selectedLibraryId =
          activeLibraryId ?? libraries?.[0]?.libraryId ?? null;

        if (!selectedLibraryId) {
          throw new Error('No libraries found.');
        }

        if (!activeLibraryId) {
          setActiveLibrary(selectedLibraryId);
        }

        const data = await libraryApi.bootstrapLibrary(selectedLibraryId);
        setBootstrapError(null);
        setLibraryData(data.library);
        setSongs(data.songs ?? []);
        setLabels(data.labels ?? [], data.superLabels ?? []);
        setSongLabels(data.songLabels ?? []);
        setModes(data.labelModes ?? []);
        setBootstrapping(false);
        setBootstrapped(true);

        if (!hasInitializedCanvasRef.current) {
          const { createSnapshot, pushUndoEntry } = useStore.getState();
          const snapshot = createSnapshot();
          pushUndoEntry({ action: 'rebuild', snapshot });
          runCanvasLayoutPipeline({ recordUndo: false });
          hasInitializedCanvasRef.current = true;
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to load library.';
        setBootstrapError(message);
      }
    }

    init();
  }, [
    setActiveLibrary,
    setBootstrapping,
    setBootstrapError,
    setBootstrapped,
    setLibraryData,
    setSongs,
    setLabels,
    setSongLabels,
    setModes,
    activeLibraryId,
  ]);

  // Loading state
  if (isBootstrapping) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading library...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (bootstrapError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Failed to load library
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {bootstrapError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      {/* Main canvas (now responsible for floating controls) */}
      <Canvas />
    </div>
  );
}
