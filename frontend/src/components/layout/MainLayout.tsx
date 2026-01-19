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

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <Header />
      
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        {leftPanelOpen && <LeftPanel />}
        
        {/* Canvas area (main content) */}
        <main className="flex-1 overflow-hidden relative bg-canvas-light dark:bg-canvas-dark">
          {children}
        </main>
        
        {/* Right Panel */}
        {rightPanelOpen && <RightPanel />}
      </div>
    </div>
  );
}
