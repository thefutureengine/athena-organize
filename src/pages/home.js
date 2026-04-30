import { supabase } from '../supabase.js';
import { navigate } from '../router.js';

/**
 * Home page — hero CTA and recent scans grid pulled from Supabase.
 * @param {HTMLElement} container
 */
export async function renderHome(container) {
  container.innerHTML = `
    <div class="page page--home">
      <header class="home__header">
        <div class="home__title-wrap">
          <h1 class="home__title">Athena</h1>
          <p class="home__subtitle">Your AI organization coach</p>
        </div>
        <div class="home__avatar" id="homeAvatar" title="Profile">A</div>
      </header>

      <div class="home__hero">
        <div class="home__hero-bg"></div>
        <div class="home__hero-content">
          <h2 class="home__hero-heading">Transform Your Space</h2>
          <p class="home__hero-text">
            Get an AI-powered efficiency score, personalized tips, and product
            recommendations — in seconds.
          </p>
          <button class="btn btn--primary btn--lg home__cta" id="scanCta">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Scan Your Space
          </button>
        </div>
      </div>

      <section class="home__recents">
        <h3 class="section-title">Recent Scans</h3>
        <div class="recents-grid" id="recentsGrid">
          <div class="skeleton-grid">
            <div class="skeleton skeleton--card"></div>
            <div class="skeleton skeleton--card"></div>
            <div class="skeleton skeleton--card"></div>
            <div class="skeleton skeleton--card"></div>
          </div>
        </div>
      </section>
    </div>
  `;

  // Wire up navigation
  document.getElementById('scanCta').addEventListener('click', () => navigate('#/camera'));
  document.getElementById('homeAvatar').addEventListener('click', () => {
    window.location.hash = '#/profile';
  });

  // Update avatar initial from saved profile
  const profile = JSON.parse(localStorage.getItem('athena_profile') || '{}');
  if (profile.name) {
    document.getElementById('homeAvatar').textContent = profile.name[0].toUpperCase();
  }

  // Fetch recent projects from Supabase
  try {
    const { data, error } = await supabase
      .from('athena_projects')
      .select('id, name, photo_url, score, created_at')
      .order('created_at', { ascending: false })
      .limit(6);

    const grid = document.getElementById('recentsGrid');
    if (!grid) return; // Page may have unmounted

    if (error) throw error;

    if (!data || data.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <p class="empty-state__text">No scans yet. Tap "Scan Your Space" to get started!</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = data.map(project => `
      <div class="recent-card" data-id="${project.id}" role="button" tabindex="0" aria-label="View ${project.name || 'scan'}">
        <div class="recent-card__img-wrap">
          ${project.photo_url
            ? `<img
                src="${project.photo_url}"
                alt="${project.name || 'Space scan'}"
                class="recent-card__img"
                loading="lazy"
              />`
            : `<div class="recent-card__placeholder" aria-hidden="true">📷</div>`
          }
          <div class="recent-card__score" aria-label="Score: ${project.score ?? 'N/A'}">${project.score ?? '--'}</div>
        </div>
        <div class="recent-card__info">
          <p class="recent-card__name">${project.name || 'Untitled Scan'}</p>
          <p class="recent-card__date">${new Date(project.created_at).toLocaleDateString()}</p>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.recent-card').forEach(card => {
      const open = () => {
        sessionStorage.setItem('currentProjectId', card.dataset.id);
        navigate('#/analysis');
      };
      card.addEventListener('click', open);
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(); });
    });

  } catch (err) {
    console.error('[Athena] Failed to load recent scans:', err);
    const grid = document.getElementById('recentsGrid');
    if (grid) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <p class="empty-state__text">Could not load recent scans. Check your connection.</p>
        </div>
      `;
    }
  }
}
