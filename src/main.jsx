import React from 'react'
import ReactDOM from 'react-dom/client'
import './theme.css'
import App from './App.jsx'

// ── Service Worker registration with update handling ──────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      if (import.meta.env.DEV) console.log('SW registered:', reg.scope);

      // Check for updates every time user visits
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        newSW?.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available — show reload prompt
            dispatchEvent(new CustomEvent('wca:sw-update'));
          }
        });
      });
    }).catch(err => {
      if (import.meta.env.DEV) console.warn('SW registration failed:', err);
    });

    // Message from SW that an update activated
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data?.type === 'SW_UPDATED') {
        dispatchEvent(new CustomEvent('wca:sw-update'));
      }
    });
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
