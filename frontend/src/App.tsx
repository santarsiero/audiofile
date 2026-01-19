/**
 * AudioFile Main Application Component
 * 
 * Sets up routing and renders the main layout.
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { LibraryPage } from '@/pages/LibraryPage';

// Placeholder pages for future implementation
const HomePage = () => <Navigate to="/library" replace />;

function App() {
  return (
    <Routes>
      {/* Default redirect to library */}
      <Route path="/" element={<HomePage />} />
      
      {/* Main library view (Workshop 1-5) */}
      <Route 
        path="/library" 
        element={
          <MainLayout>
            <LibraryPage />
          </MainLayout>
        } 
      />
      
      {/* Future: Settings page (Workshop 6 - modal, but could be route) */}
      {/* <Route path="/settings" element={<SettingsPage />} /> */}
      
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/library" replace />} />
    </Routes>
  );
}

export default App;
