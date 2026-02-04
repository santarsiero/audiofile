/**
 * AudioFile Main Application Component
 * 
 * Sets up routing and renders the main layout.
 */

import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getAccessToken } from '@/services/authTokens';
import { useStore } from '@/store';
import { MainLayout } from '@/components/layout/MainLayout';
import { LibraryPage } from '@/pages/LibraryPage';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';

// Placeholder pages for future implementation
const HomePage = () => <Navigate to="/library" replace />;

function App() {
  const setAuthenticated = useStore((state) => state.setAuthenticated);
  const isAuthenticated = Boolean(getAccessToken());

  useEffect(() => {
    setAuthenticated(Boolean(getAccessToken()));
  }, [setAuthenticated]);

  return (
    <Routes>
      {/* Default redirect to library */}
      <Route path="/" element={<HomePage />} />
      
      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />
      
      {/* Main library view (Workshop 1-5) */}
      <Route 
        path="/library" 
        element={
          isAuthenticated ? (
            <MainLayout>
              <LibraryPage />
            </MainLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      {/* Future: Settings page (Workshop 6 - modal, but could be route) */}
      {/* <Route path="/settings" element={<SettingsPage />} /> */}
      
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to={isAuthenticated ? '/library' : '/login'} replace />} />
    </Routes>
  );
}

export default App;
