import { searchProducts } from '../api.js';

/**
 * Recommendations page — returns its container synchronously with a loading
 * state, then fetches products asynchronously and fills in. (Returning the
 * container after `await` would leave the screen blank until the fetch
 * resolved — the router only mounts what the function returns.)
 */
export function recommendationsPage() {
  const container = document.createElement('div');
  container.className = 'page recommendations-page';

  container.innerHTML = `
    <div class="recs-header">
      <h2>Recommendations</h2>
      <p>Products tailored to each issue Athena found.</p>
    </div>
    <div id="recsContent">
      <div class="loading-state">
        <div class="spinner">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="14" stroke="rgba(255,255,255,0.1)" stroke-width="3"/>
            <path d="M32 18 A14 14 0 0 0 18 4" stroke="#E91E63" stroke-width="3" stroke-linecap="round"/>
          </svg>
        </div>
        <p>Finding the best products for your space…</p>
      </div>
    </div>
  `;

  loadRecommendations(container).catch((err) => {
    const contentEl = container.querySelector('#recsContent');
    if (contentEl) {
      contentEl.innerHTML = `
        <div class="error-state">
          Failed to load recommendations: ${escHtml(err.message)}
          <br><br>
          <button class="btn btn--secondary" onclick="location.reload()">Retry</button>
        </div>
      `;
    }
  });

  return container;
}

async function loadRecommendations(container) {
  const contentEl = container.querySelector('#recsContent');
  if (!contentEl) return;

  let analysis;
  try {
    analysis = JSON.parse(sessionStorage.getItem('athena_analysis') || 'null');
  } catch {
    analysis = null;
  }

  if (!analysis || !Array.isArray(analysis.issues) || analysis.issues.length === 0) {
    contentEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">🔍</div>
        <p class="empty-state__title">No analysis found</p>
        <p>Please scan a space first to get recommendations.</p>
        <button class="btn btn--primary mt-16" id="goScan">Scan a Space</button>
      </div>
    `;
    contentEl.querySelector('#goScan')?.addEventListener('click', () => {
      window.location.hash = '#/camera';
    });
    return;
  }

  let measurements = null;
  try {
    measurements = JSON.parse(sessionStorage.getItem('athena_measurements') || 'null');
  } catch {}

  const result = await searchProducts({ issues: analysis.issues, measurements });
  const recommendations = result.recommendations || [];

  if (recommendations.length === 0) {
    contentEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">🛍️</div>
        <p class="empty-state__title">No products found</p>
        <p>We couldn't find product matches right now. Try scanning again later.</p>
      </div>
    `;
    return;
  }

  sessionStorage.setItem('athena_recommendations', JSON.stringify(recommendations));

  contentEl.innerHTML = '';

  recommendations.forEach((item) => {
    if (!item || !item.issue) return;
    contentEl.appendChild(buildIssueGroup(item));
  });

  const cta = document.createElement('div');
  cta.className = 'mt-16';
  cta.innerHTML = `
    <button class="btn btn--primary btn--full" id="genBtn" type="button">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 9 6 6m0-6-6 6"/>
      </svg>
      Generate AI Vision
    </button>
  `;
  cta.querySelector('#genBtn').addEventListener('click', () => {
    window.location.hash = '#/before-after';
  });
  contentEl.appendChild(cta);
}

function buildIssueGroup(item) {
  const { issue, tiers } = item;
  const defaultTier = tiers?.better ? 'better' : tiers?.good ? 'good' : 'best';

  const group = document.createElement('div');
  group.className = 'card issue-rec-group';

  const title = document.createElement('div');
  title.className = 'issue-rec-group__title';
  title.textContent = issue;
  group.appendChild(title);

  const availableTiers = ['good', 'better', 'best'].filter((t) => tiers?.[t] != null);

  if (availableTiers.length === 0) {
    const empty = document.createElement('p');
    empty.style.cssText = 'font-size:0.85rem;color:var(--text-muted);padding:8px 0;';
    empty.textContent = 'No specific product recommendations found for this issue.';
    group.appendChild(empty);
    return group;
  }

  const chipRow = document.createElement('div');
  chipRow.className = 'tier-selector';

  const tierLabels = { good: '👍 Good', better: '⭐ Better', best: '🏆 Best' };
  const activeTier = availableTiers.includes(defaultTier) ? defaultTier : availableTiers[0];

  const chips = {};
  availableTiers.forEach((tier) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `tier-chip${tier === activeTier ? ' active' : ''}`;
    chip.textContent = tierLabels[tier];
    chip.dataset.tier = tier;
    chips[tier] = chip;
    chipRow.appendChild(chip);
  });
  group.appendChild(chipRow);

  const cardSlot = document.createElement('div');
  cardSlot.className = 'mt-12';
  group.appendChild(cardSlot);

  renderProduct(cardSlot, tiers[activeTier]);

  availableTiers.forEach((tier) => {
    chips[tier].addEventListener('click', () => {
      availableTiers.forEach((t) => chips[t].classList.remove('active'));
      chips[tier].classList.add('active');
      renderProduct(cardSlot, tiers[tier]);
    });
  });

  return group;
}

function renderProduct(containerEl, product) {
  containerEl.innerHTML = '';
  if (!product) {
    containerEl.innerHTML = `<p style="font-size:0.82rem;color:var(--text-muted);">No product available for this tier.</p>`;
    return;
  }

  const card = document.createElement('div');
  card.className = 'card product-card';

  const thumbEl = document.createElement('div');
  if (product.thumbnail) {
    const img = document.createElement('img');
    img.className = 'product-card__thumb';
    img.src = product.thumbnail;
    img.alt = escHtml(product.name);
    img.loading = 'lazy';
    img.onerror = () => { img.replaceWith(makePlaceholderThumb()); };
    thumbEl.appendChild(img);
  } else {
    thumbEl.appendChild(makePlaceholderThumb());
  }
  card.appendChild(thumbEl);

  const info = document.createElement('div');
  info.className = 'product-card__info';

  const name = document.createElement('div');
  name.className = 'product-card__name';
  name.title = product.name;
  name.textContent = product.name;
  info.appendChild(name);

  const meta = document.createElement('div');
  meta.className = 'product-card__meta';
  meta.innerHTML = `
    <span class="product-card__price">${escHtml(product.price)}</span>
    <span class="product-card__retailer">${escHtml(product.retailer)}</span>
  `;
  info.appendChild(meta);

  const buyLink = document.createElement('a');
  buyLink.className = 'product-card__buy';
  buyLink.href = product.link;
  buyLink.target = '_blank';
  buyLink.rel = 'noopener noreferrer';
  buyLink.innerHTML = `
    Buy
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left:4px">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  `;
  info.appendChild(buyLink);

  card.appendChild(info);
  containerEl.appendChild(card);
}

function makePlaceholderThumb() {
  const el = document.createElement('div');
  el.className = 'product-card__thumb-placeholder';
  el.textContent = '📦';
  return el;
}

function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
