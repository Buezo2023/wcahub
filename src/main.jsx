import React from 'react'
import ReactDOM from 'react-dom/client'
import './theme.css'
import App from './App.jsx'

// ── Service Worker: desregistrar cualquier SW previo ─────────────
// No se usa PWA offline en esta app — el banner de "actualizar" era
// un falso positivo que aparecía en cada deploy.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(reg => reg.unregister());
  });
}

// ── Clear stale localStorage keys on app load ─────────────────────
(function cleanStaleCache() {
  const VALID_KEYS = ['wca-theme', 'wca_pending_progress', 'wca_cookie_consent'];
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('wca_') || key === 'wca-theme') {
        if (!VALID_KEYS.includes(key)) {
          localStorage.removeItem(key);
        }
      }
    }
  } catch(e) { /* localStorage may be blocked in private mode */ }
})();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
