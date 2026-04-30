import { renderHome } from './pages/home.js';
import { renderCamera } from './pages/camera.js';
import { renderAnalysis } from './pages/analysis.js';
import { renderRecommendations } from './pages/recommendations.js';
import { renderBeforeAfter } from './pages/beforeAfter.js';
import { renderScans } from './pages/scans.js';
import { renderInsights } from './pages/insights.js';
import { renderProfile } from './pages/profile.js';
import { renderBottomNav } from './components/BottomNav.js';

/** Pages that display the bottom navigation bar */
const NAV_PAGES = new Set(['#/', '#/scans', '#/insights', '#/profile']);

/** Route map: hash → render function */
const ROUTES = {
  '#/': renderHome,
  '#/camera': renderCamera,
  '#/analysis': renderAnalysis,
  '#/recommendations': renderRecommendations,
  '#/before-after': renderBeforeAfter,
  '#/scans': renderScans,
  '#/insights': renderInsights,
  '#/profile': renderProfile,
};

/** History stack for back-button behavior */
let historyStack = [];

/**
 * Navigate to a new hash, pushing current location onto the stack.
 * @param {string} hash - e.g. '#/camera'
 */
export function navigate(hash) {
  historyStack.push(window.location.hash || '#/');
  window.location.hash = hash;
}

/**
 * Go back one step in the internal history, falling back to home.
 */
export function goBack() {
  if (historyStack.length > 0) {
    window.location.hash = historyStack.pop();
  } else {
    window.location.hash = '#/';
  }
}

/**
 * Initialize the router: render on load and on each hashchange.
 */
export function initRouter() {
  const app = document.getElementById('app');

  function render() {
    const hash = window.location.hash || '#/';
    const routeFn = ROUTES[hash] || renderHome;
    const showNav = NAV_PAGES.has(hash);

    // Clear previous content
    app.innerHTML = '';

    // Page container
    const pageContainer = document.createElement('div');
    pageContainer.className = showNav ? 'page-container with-nav' : 'page-container';
    app.appendChild(pageContainer);

    // Bottom nav for tabbed pages
    if (showNav) {
      const navEl = renderBottomNav(hash);
      app.appendChild(navEl);
    }

    // Render the page into the container
    routeFn(pageContainer);
  }

  window.addEventListener('hashchange', render);

  // Ensure a default hash exists
  if (!window.location.hash) {
    window.location.hash = '#/';
  }

  render();
}
