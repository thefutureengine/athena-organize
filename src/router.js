import { renderBottomNav } from './components/BottomNav.js';

/** Routes that should hide the bottom navigation */
const NO_NAV_ROUTES = new Set(['/camera']);

/** Maps hash paths to lazy page imports */
const routes = {
  '/': () => import('./pages/home.js'),
  '/camera': () => import('./pages/camera.js'),
  '/analysis': () => import('./pages/analysis.js'),
  '/recommendations': () => import('./pages/recommendations.js'),
  '/before-after': () => import('./pages/beforeAfter.js'),
  '/scans': () => import('./pages/scans.js'),
  '/insights': () => import('./pages/insights.js'),
  '/profile': () => import('./pages/profile.js'),
};

const app = document.getElementById('app');

/** Extract path from hash, defaulting to '/' */
function getPath() {
  const hash = window.location.hash.slice(1);
  if (!hash || hash === '/') return '/';
  return hash.startsWith('/') ? hash : '/' + hash;
}

/** Render a route into #app */
async function render(path) {
  const loader = routes[path] || routes['/'];

  // Clear previous page
  app.innerHTML = '';

  const showNav = !NO_NAV_ROUTES.has(path);

  if (showNav) {
    const nav = renderBottomNav(path);
    app.appendChild(nav);
  }

  const pageContainer = document.createElement('div');
  pageContainer.className = showNav ? 'page-with-nav' : 'page-full';
  app.appendChild(pageContainer);

  try {
    const module = await loader();
    await module.default(pageContainer);
  } catch (err) {
    console.error('[Router] Page load error:', err);
    pageContainer.innerHTML = `
      <div style="padding:32px 20px; text-align:center; color:#999;">
        <p style="font-size:1.1rem; margin-bottom:16px;">Page failed to load.</p>
        <a href="#/" style="color:#E91E63;">Go Home</a>
      </div>
    `;
  }
}

export const router = {
  init() {
    window.addEventListener('hashchange', () => render(getPath()));
    render(getPath());
  },
  navigate(path) {
    window.location.hash = path;
  },
  back() {
    window.history.back();
  },
};
