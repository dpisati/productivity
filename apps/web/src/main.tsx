import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { applyTheme, useThemeStore } from '@/stores/theme';
import './index.css';

// Apply the persisted theme before first paint.
applyTheme(useThemeStore.getState().theme);

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
