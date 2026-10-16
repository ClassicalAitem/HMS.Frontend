import './utils/toastDedupe';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './App.jsx';

// Prevent Vite dev server from forcibly reloading the application when the user switches browser tabs.
// When a browser tab is inactive, Chrome/Edge throttles timers and drops the HMR WebSocket connection.
// By intercepting 'vite:ws:disconnect' and 'vite:beforeFullReload', we suppress the unwanted location.reload().
if (import.meta.hot) {
  // Silent handling of disconnects to avoid unhandled runtime errors in dev mode
  import.meta.hot.on('vite:ws:disconnect', () => {
    // Suppress unhandled disconnect errors
  });
}

createRoot(document.getElementById('root')).render(
  <App />
);
