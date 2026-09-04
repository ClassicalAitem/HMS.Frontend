import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './App.jsx';

// Prevent Vite dev server from forcibly reloading the application when the user switches browser tabs.
// When a browser tab is inactive, Chrome/Edge throttles timers and drops the HMR WebSocket connection.
// By intercepting 'vite:ws:disconnect' and 'vite:beforeFullReload', we suppress the unwanted location.reload().
if (import.meta.hot) {
  let isTabReactivated = false;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      isTabReactivated = true;
      setTimeout(() => {
        isTabReactivated = false;
      }, 3000);
    }
  });

  import.meta.hot.on('vite:ws:disconnect', () => {
    // Intercept disconnect to prevent Vite from polling and triggering location.reload() on tab focus
    throw new Error('[vite] Suppressed automatic full-reload caused by background tab WebSocket disconnect.');
  });

  import.meta.hot.on('vite:beforeFullReload', () => {
    if (isTabReactivated || document.visibilityState === 'hidden') {
      throw new Error('[vite] Suppressed automatic full-reload on tab reactivation.');
    }
  });
}

createRoot(document.getElementById('root')).render(
  <App />
);
