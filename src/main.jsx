import './utils/toastDedupe';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './App.jsx';

// Handle dynamic import failures when a new production build replaces chunk hashes
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  if (import.meta.env.DEV) return;
  const now = Date.now();
  const lastReload = parseInt(sessionStorage.getItem('chunk_reload_time') || '0', 10);
  if (now - lastReload > 8000) {
    sessionStorage.setItem('chunk_reload_time', String(now));
    window.location.reload();
  }
});

// Prevent Vite dev server from forcibly reloading the application when the user switches browser tabs.
if (import.meta.hot) {
  // Silent handling of disconnects to avoid unhandled runtime errors in dev mode
  import.meta.hot.on('vite:ws:disconnect', () => {
    // Suppress unhandled disconnect errors
  });
}

createRoot(document.getElementById('root')).render(
  <App />
);
