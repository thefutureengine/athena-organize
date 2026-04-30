import { supabase } from '../supabase.js';
import { navigate } from '../router.js';

const PAGE_SIZE = 10;

/**
 * Scans page — paginated history of saved projects.
 * @param {HTMLElement} container
 */
export async function renderScans(container) {
  container.innerHTML = `
    <div class="page page--scans">
      <header class="page-header page-header--static">
        <h2 class="page-header__title">My Scans</h2>
      </header>

      <div class="scans__body" id="scansBody">
        <div class="skeleton-list" aria-busy="true" aria-label="Loading scans">
          <div class="skeleton skeleton--list-item"></div>
          <div class="skeleton skeleton--list-item"></div>
          <div class="skeleton skeleton--list-item"></div>
          <div class="skeleton skeleton--list-item"></div>
          <div class="skeleton skeleton--list-item"></div>
        </div>
      </div>

      <div class="scans__pagination" id="pagination"></div>
    </div>
  `;

  let currentPage = 0;

  async function loadPage(page) {
    const body = document.getElementById('scansBody');
    if (!body) return;

    body.innerHTML = `
      <div class="skeleton-list">
        ${Array(5).fill('<div class="skeleton skeleton--list-item"></div>').join('')}
      </div>
    `;

    const from = page * PAGE_SIZE;
    const to   = from + PAGE_SIZE - 1;

    const { data, error, count } = await supabase
      .from('athena_projects')
      .select('id, name, score, status, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      body.innerHTML = `
        <div class="empty-state">
          <p class="empty-state__text">Could not load scans. Check your connection.</p>
        </div>
      `;
      return;
    }

    if (data.length === 0 && page === 0) {
      body.innerHTML = `
        <div class="empty-state">
          <p class="empty-state__text">No scans yet. Start by photographing a space!</p>
          <button class="btn btn--primary" id="startScanBtn">Start Scanning</button>
        </div>
      `;
      document.getElementById('startScanBtn')?.addEventListener('click', () => navigate('#/camera'));
      return;
    }

    body.innerHTML = data.map(project => `
      <div class="scan-item card" data-id="${project.id}" role="button" tabindex="0" aria-label="View scan: ${escapeHtml(project.name || 'Untitled')}">
        <div class="scan-item__score-badge" style="--score-color:${scoreColor(project.score)}" aria-label="Score: ${project.score ?? 'N/A'}">
          ${project.score ?? '--'}
        </div>
        <div class="scan-item__info">
          <p class="scan-item__name">${escapeHtml(project.name || 'Untitled Scan')}</p>
          <p class="scan-item__date">${new Date(project.created_at).toLocaleString()}</p>
          <span class="scan-item__status">${escapeHtml(project.status || 'analyzed')}</span>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
    `).join('');

    body.querySelectorAll('.scan-item').forEach(item => {
      const open = () => {
        sessionStorage.setItem('currentProjectId', item.dataset.id);
        navigate('#/analysis');
      };
      item.addEventListener('click', open);
      item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(); });
    });

    // Pagination
    const totalPages = Math.ceil((count || 0) / PAGE_SIZE);
    const paginationEl = document.getElementById('pagination');
    if (!paginationEl) return;

    if (totalPages > 1) {
      paginationEl.innerHTML = `
        <button class="btn btn--ghost" id="prevPage" ${page === 0 ? 'disabled' : ''} aria-label="Previous page">← Prev</button>
        <span class="pagination__info" aria-live="polite">${page + 1} / ${totalPages}</span>
        <button class="btn btn--ghost" id="nextPage" ${page >= totalPages - 1 ? 'disabled' : ''} aria-label="Next page">Next →</button>
      `;
      document.getElementById('prevPage')?.addEventListener('click', () => { currentPage--; loadPage(currentPage); });
      document.getElementById('nextPage')?.addEventListener('click', () => { currentPage++; loadPage(currentPage); });
    } else {
      paginationEl.innerHTML = '';
    }
  }

  loadPage(0);
}

function scoreColor(score) {
  if (score === null || score === undefined) return 'var(--text-muted)';
  if (score >= 80) return '#4CAF50';
  if (score >= 60) return '#FF9800';
  return '#E91E63';
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
