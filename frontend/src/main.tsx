/**
 * AudioFile Application Entry Point
 * 
 * Initializes React app with routing and store.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { initializeTheme } from '@/store';
import './index.css';

// Initialize theme before render (prevents flash)
initializeTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
