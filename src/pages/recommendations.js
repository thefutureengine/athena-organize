import { navigate, goBack } from '../router.js';
import { generateImages } from '../api.js';

/**
 * Recommendations page — product cards with thumbnail, name, price,
 * retailer, and a "Buy" link; CTA to generate before/after imagery.
 * @param {HTMLElement} container
 */
export function renderRecommendations(container) {
  container.innerHTML = `
    <div class="page page--recommendations">
      <header class="page-header">
        <button class="btn-icon" id="backBtn" aria-label="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h2 class="page-header__title">Recommendations</h2>
        <div style="width:40px"></div>
      </header>

      <div class="recs__body">
        <div class="recs__list" id="recsList"></div>

        <button class="btn btn--primary btn--full" id="beforeAfterBtn" style="margin-top:8px;">
          See Before &amp; After
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  document.getElementById('backBtn').addEventListener('click', goBack);

  const list = document.getElementById('recsList');
  const raw = sessionStorage.getItem('recommendations');

  let recs = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      recs = Array.isArray(parsed) ? parsed : (parsed.products || []);
    } catch {
      recs = [];
    }
  }

  if (recs.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <p class="empty-state__text">No product recommendations available. Try scanning a different space.</p>
      </div>
    `;
  } else {
    list.innerHTML = recs.map(product => `
      <div class="product-card card">
        <div class="product-card__img-wrap">
          ${product.thumbnail
            ? `<img
                src="${escapeHtml(product.thumbnail)}"
                alt="${escapeHtml(product.name || 'Product')}"
                class="product-card__img"
                loading="lazy"
                onerror="this.parentElement.innerHTML='<div class=\\'product-card__img-placeholder\\' aria-hidden=\\'true\\'>🛒</div>'"
              />`
            : `<div class="product-card__img-placeholder" aria-hidden="true">🛒</div>`
          }
        </div>
        <div class="product-card__info">
          <p class="product-card__name" title="${escapeHtml(product.name || '')}">${escapeHtml(product.name || 'Product')}</p>
          ${product.retailer ? `<p class="product-card__retailer">${escapeHtml(product.retailer)}</p>` : ''}
          <p class="product-card__price">${escapeHtml(product.price || 'Price varies')}</p>
        </div>
        <a
          href="${escapeHtml(product.link || '#')}"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn--outline product-card__btn"
          aria-label="Buy ${escapeHtml(product.name || 'product')}"
        >Buy</a>
      </div>
    `).join('');
  }

  document.getElementById('beforeAfterBtn').addEventListener('click', async () => {
    const btn = document.getElementById('beforeAfterBtn');
    btn.disabled = true;
    btn.innerHTML = `
      <div class="spinner" style="width:18px;height:18px;border-width:2px;" aria-hidden="true"></div>
      Generating…
    `;

    try {
      const imageBase64 = sessionStorage.getItem('capturedImageBase64') || '';
      const analysis = JSON.parse(sessionStorage.getItem('analysisResult') || '{}');
      const planSummary = analysis.summary || 'Organize and declutter the space for maximum efficiency';

      const result = await generateImages(imageBase64, planSummary);
      sessionStorage.setItem('generatedAfterUrl', result.afterImageUrl || '');
      navigate('#/before-after');
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = `See Before &amp; After
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>`;
      alert(`Could not generate images: ${err.message}\n\nEnsure OPENAI_API_KEY is set in your Netlify environment.`);
    }
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
