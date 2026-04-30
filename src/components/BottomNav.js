/**
 * BottomNav component — 4 fixed tabs: Home, Scans, Insights, Profile.
 * Active tab is highlighted in the brand pink (#E91E63).
 */

const TABS = [
  {
    hash: '#/',
    label: 'Home',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>`,
  },
  {
    hash: '#/scans',
    label: 'Scans',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M9 21V9"/>
    </svg>`,
  },
  {
    hash: '#/insights',
    label: 'Insights',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>`,
  },
  {
    hash: '#/profile',
    label: 'Profile',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>`,
  },
];

/**
 * Render the bottom navigation bar.
 * @param {string} activeHash - Current route hash, e.g. '#/'
 * @returns {HTMLElement}
 */
export function renderBottomNav(activeHash) {
  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.setAttribute('aria-label', 'Main navigation');

  nav.innerHTML = TABS.map(tab => `
    <button
      class="bottom-nav__tab${tab.hash === activeHash ? ' active' : ''}"
      data-hash="${tab.hash}"
      aria-label="${tab.label}"
      aria-current="${tab.hash === activeHash ? 'page' : 'false'}"
    >
      <span class="bottom-nav__icon" aria-hidden="true">${tab.icon}</span>
      <span class="bottom-nav__label">${tab.label}</span>
    </button>
  `).join('');

  nav.querySelectorAll('.bottom-nav__tab').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.hash = btn.dataset.hash;
    });
  });

  return nav;
}
