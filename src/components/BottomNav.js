/**
 * BottomNav — premium tabbed navigation.
 * Active tab uses a filled icon variant + pink accent + small indicator dot.
 * Inactive tabs use outlined icons in muted tone with subtle hover/press feedback.
 */

const TABS = [
  {
    hash: '#/',
    label: 'Home',
    outline: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 10.5 12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5h-4.25v-6.75h-6.5v6.75H4.5A1.5 1.5 0 0 1 3 20Z"/>
    </svg>`,
    filled:  `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.36 2.39a1 1 0 0 1 1.28 0l8 6.65A1 1 0 0 1 21 9.78V20a2 2 0 0 1-2 2h-4.5v-7h-5v7H5a2 2 0 0 1-2-2V9.78a1 1 0 0 1 .36-.74Z"/>
    </svg>`,
  },
  {
    hash: '#/scans',
    label: 'Scans',
    outline: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3.25" y="5" width="17.5" height="14" rx="2.5"/>
      <path d="M3.25 10h17.5"/>
      <path d="M9 19v-9"/>
    </svg>`,
    filled:  `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.5 4.5h13a3 3 0 0 1 3 3V9H2.5V7.5a3 3 0 0 1 3-3Zm-3 6h5.25v9H5.5a3 3 0 0 1-3-3v-6Zm6.75 0h12.25v6a3 3 0 0 1-3 3H9.25v-9Z"/>
    </svg>`,
  },
  {
    hash: '#/insights',
    label: 'Insights',
    outline: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 19V11"/>
      <path d="M12 19V5"/>
      <path d="M19 19v-5"/>
    </svg>`,
    filled:  `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <rect x="3.5" y="11" width="3.5" height="9" rx="1.25"/>
      <rect x="10.25" y="4" width="3.5" height="16" rx="1.25"/>
      <rect x="17" y="13" width="3.5" height="7" rx="1.25"/>
    </svg>`,
  },
  {
    hash: '#/profile',
    label: 'Profile',
    outline: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>
    </svg>`,
    filled:  `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="8" r="4.25"/>
      <path d="M3.75 21.25a8.25 8.25 0 0 1 16.5 0 .75.75 0 0 1-.75.75H4.5a.75.75 0 0 1-.75-.75Z"/>
    </svg>`,
  },
];

export function renderBottomNav(activeHash) {
  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.setAttribute('aria-label', 'Main navigation');

  nav.innerHTML = TABS.map(tab => {
    const active = tab.hash === activeHash;
    return `
      <button
        class="bottom-nav__tab${active ? ' is-active' : ''}"
        data-hash="${tab.hash}"
        aria-label="${tab.label}"
        aria-current="${active ? 'page' : 'false'}"
      >
        <span class="bottom-nav__indicator" aria-hidden="true"></span>
        <span class="bottom-nav__icon" aria-hidden="true">${active ? tab.filled : tab.outline}</span>
        <span class="bottom-nav__label">${tab.label}</span>
      </button>
    `;
  }).join('');

  nav.querySelectorAll('.bottom-nav__tab').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.hash = btn.dataset.hash;
    });
  });

  return nav;
}
