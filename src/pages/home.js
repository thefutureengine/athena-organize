import { supabase } from '../supabase.js';
import { Logo } from '../components/Logo.js';

const STUB_USER = { name: 'You', email: 'user@athena.app' };

/**
 * Home page — hero section with Athena logo avatar, "Scan Your Space" CTA,
 * and a 2-column grid of recent scanned spaces pulled from Supabase.
 */
export async function homePage() {
  const container = document.createElement('div');
  container.className = 'page home-page';

  // ── Hero ──────────────────────────────────────────────────────
  const hero = document.createElement('section');
  hero.className = 'home__hero';

  // Avatar using Logo component
  const avatarEl = document.createElement('div');
  avatarEl.className = 'home__avatar';
  avatarEl.title = 'Athena';
  const logoEl = Logo({ size: 32, color: '#E91E63', neutral: '#f5f5f5' });
  avatarEl.appendChild(logoEl);

  const greetingEl = document.createElement('div');
  greetingEl.className = 'home__greeting';
  greetingEl.innerHTML = `
    <span class="home__greeting-sub">Good ${getTimeOfDay()}</span>
    <h1>Your Spaces</h1>
  `;

  const heroHeader = document.createElement('div');
  heroHeader.className = 'home__hero-header';
  heroHeader.appendChild(greetingEl);
  heroHeader.appendChild(avatarEl);

  const ctaRow = document.createElement('div');
  ctaRow.className = 'home__cta-row';
  ctaRow.innerHTML = `
    <button class="btn btn--primary btn--full" id="scanCta">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
      Scan Your Space
    </button>
  `;

  hero.appendChild(heroHeader);
  hero.appendChild(ctaRow);
  container.appendChild(hero);

  // ── Recent Spaces ─────────────────────────────────────────────
  const recentSection = document.createElement('section');
  recentSection.className = 'home__recent';
  recentSection.innerHTML = `
    <p class="home__section-title">Recent Spaces</p>
    <div id="spacesContent">
      <div class="loading-state">
        <div class="spinner">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="14" stroke="rgba(255,255,255,0.1)" stroke-width="3"/>
            <path d="M32 18 A14 14 0 0 0 18 4" stroke="#E91E63" stroke-width="3" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
    </div>
  `;
  container.appendChild(recentSection);

  // CTA navigation
  container.querySelector('#scanCta').addEventListener('click', () => {
    window.location.hash = '#/camera';
  });

  // Load spaces async
  loadRecentSpaces(recentSection.querySelector('#spacesContent'));

  return container;
}

async function loadRecentSpaces(contentEl) {
  try {
    const { data: projects, error } = await supabase
      .from('athena_projects')
      .select('id, name, photo_url, score, created_at')
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) throw error;

    if (!projects || projects.length === 0) {
      contentEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🏠</div>
          <p class="empty-state__title">No spaces scanned yet</p>
          <p>Tap "Scan Your Space" to get your first AI efficiency score.</p>
        </div>
      `;
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'spaces-grid';

    projects.forEach((project) => {
      const card = document.createElement('div');
      card.className = 'card space-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `View ${project.name || 'Unnamed space'}`);

      const thumbHtml = project.photo_url
        ? `<img class="space-card__thumb" src="${esc(project.photo_url)}" alt="${esc(project.name || 'Space')}" loading="lazy">`
        : `<div class="space-card__thumb-placeholder">🏠</div>`;

      const scoreLabel = typeof project.score === 'number'
        ? `<span class="score-badge">${project.score}/100</span>`
        : '';

      card.innerHTML = `
        ${thumbHtml}
        <div class="space-card__name">${esc(project.name || 'Unnamed space')}</div>
        <div class="space-card__meta">
          ${scoreLabel}
          <span class="space-card__date">${formatDate(project.created_at)}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        sessionStorage.setItem('athena_project_id', project.id);
        window.location.hash = '#/scans';
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') card.click();
      });

      grid.appendChild(card);
    });

    contentEl.innerHTML = '';
    contentEl.appendChild(grid);
  } catch (err) {
    contentEl.innerHTML = `
      <div class="error-state">
        Failed to load recent spaces: ${esc(err.message)}
      </div>
    `;
  }
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
