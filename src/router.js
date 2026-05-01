import { homePage } from './pages/home.js';
import { cameraPage } from './pages/camera.js';
import { renderAnalysis } from './pages/analysis.js';
import { recommendationsPage } from './pages/recommendations.js';
import { beforeAfterPage } from './pages/beforeAfter.js';
import { renderScans } from './pages/scans.js';
import { renderInsights } from './pages/insights.js';
import { renderProfile } from './pages/profile.js';
import { renderBottomNav } from './components/BottomNav.js';

const NAV_PAGES = new Set(['#/', '#/scans', '#/insights', '#/profile']);

// Two page contracts coexist:
//   - "returns": page function takes no args and returns an HTMLElement.
//   - "mounts":  page function takes a container element and renders into it.
const ROUTES = {
  '#/':                { fn: homePage,             style: 'returns' },
  '#/camera':          { fn: cameraPage,           style: 'returns' },
  '#/analysis':        { fn: renderAnalysis,       style: 'mounts'  },
  '#/recommendations': { fn: recommendationsPage,  style: 'returns' },
  '#/before-after':    { fn: beforeAfterPage,      style: 'returns' },
  '#/scans':           { fn: renderScans,          style: 'mounts'  },
  '#/insights':        { fn: renderInsights,       style: 'mounts'  },
  '#/profile':         { fn: renderProfile,        style: 'mounts'  },
};

let historyStack = [];

export function navigate(hash) {
  historyStack.push(window.location.hash || '#/');
  window.location.hash = hash;
}

export function goBack() {
  if (historyStack.length > 0) {
    window.location.hash = historyStack.pop();
  } else {
    window.location.hash = '#/';
  }
}

export function initRouter() {
  const app = document.getElementById('app');

  async function render() {
    const hash = window.location.hash || '#/';
    const route = ROUTES[hash] || ROUTES['#/'];
    const showNav = NAV_PAGES.has(hash);

    app.innerHTML = '';

    const pageContainer = document.createElement('div');
    pageContainer.className = showNav ? 'page-container with-nav' : 'page-container';
    app.appendChild(pageContainer);

    if (showNav) {
      app.appendChild(renderBottomNav(hash));
    }

    if (route.style === 'returns') {
      const el = await route.fn();
      if (el instanceof Node) pageContainer.appendChild(el);
    } else {
      await route.fn(pageContainer);
    }
  }

  window.addEventListener('hashchange', render);

  if (!window.location.hash) {
    window.location.hash = '#/';
  }

  render();
}
