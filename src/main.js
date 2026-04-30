import './style.css';
import { initRouter } from './router.js';

// Register service worker (served from /service-worker.js via public/ directory)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js', { scope: '/' })
      .then(reg => {
        console.log('[Athena] Service worker registered:', reg.scope);
      })
      .catch(err => {
        console.warn('[Athena] Service worker registration failed:', err);
      });
  });
}

// Bootstrap the hash-based router
initRouter();
