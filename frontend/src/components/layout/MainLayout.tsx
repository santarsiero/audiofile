/**
 * AudioFile Main Layout Component
 * 
 * Primary layout wrapper for the application.
 * Provides the header, panel areas, and canvas container.
 * 
 * Layout structure:
 * ┌─────────────────────────────────────────────────────────────┐
 * │                          Header                              │
 * ├────────┬───────────────────────────────────────┬────────────┤
 * │        │                                        │            │
 * │  Left  │              Canvas                    │   Right    │
 * │ Panel  │              (children)                │   Panel    │
 * │        │                                        │            │
 * └────────┴───────────────────────────────────────┴────────────┘
 */

import type { ReactNode } from 'react';
import { Header } from './Header';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { useStore } from '@/store';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const leftPanelOpen = useStore((state) => state.left.isOpen);
  const rightPanelOpen = useStore((state) => state.right.isOpen);
  const openPanel = useStore((state) => state.openPanel);

  return (
    <div className="h-screen max-h-screen flex flex-col overflow-hidden bg-canvas-light dark:bg-canvas-dark">
      {/* Header */}
      <Header />
      
      {/* Main content area */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left Panel */}
        {leftPanelOpen && (
          <div className="flex-shrink-0 h-full">
            <LeftPanel />
          </div>
        )}
        
        {/* Canvas area (main content) */}
        <main className="flex-1 min-w-0 min-h-0 overflow-hidden relative">
          {!leftPanelOpen && (
            <button
              type="button"
              aria-label="Open songs panel"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-30 h-24 w-3 bg-gray-200/90 dark:bg-gray-800/80 hover:bg-gray-300/90 dark:hover:bg-gray-700/80 rounded-r"
              onClick={() => openPanel('left', 'song-list')}
            />
          )}

          {!rightPanelOpen && (
            <button
              type="button"
              aria-label="Open labels panel"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-30 h-24 w-3 bg-gray-200/90 dark:bg-gray-800/80 hover:bg-gray-300/90 dark:hover:bg-gray-700/80 rounded-l"
              onClick={() => openPanel('right', 'label-list')}
            />
          )}

          {children}
        </main>
        
        {/* Right Panel */}
        {rightPanelOpen && (
          <div className="flex-shrink-0 h-full">
            <RightPanel />
          </div>
        )}
      </div>
    </div>
  );
}
