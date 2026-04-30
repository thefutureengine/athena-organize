import { navigate, goBack } from '../router.js';
import { createScoreCircle } from '../components/ScoreCircle.js';
import { searchProducts } from '../api.js';

/**
 * Analysis page — score circle, AI summary, bulleted issues list,
 * and CTA to load product recommendations.
 * @param {HTMLElement} container
 */
export function renderAnalysis(container) {
  const raw = sessionStorage.getItem('analysisResult');

  if (!raw) {
    container.innerHTML = `
      <div class="page page--analysis">
        <header class="page-header">
          <button class="btn-icon" id="backBtn" aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <h2 class="page-header__title">Analysis</h2>
          <div style="width:40px"></div>
        </header>
        <div class="empty-state">
          <p class="empty-state__text">No analysis data found. Please scan a space first.</p>
          <button class="btn btn--primary" id="goScanBtn">Scan Now</button>
        </div>
      </div>
    `;
    document.getElementById('backBtn').addEventListener('click', goBack);
    document.getElementById('goScanBtn').addEventListener('click', () => navigate('#/camera'));
    return;
  }

  let analysis;
  try {
    analysis = JSON.parse(raw);
  } catch {
    analysis = { score: 0, issues: [], summary: 'Analysis data could not be parsed.' };
  }

  const { score, issues, summary } = analysis;
  const scoreLabel = score >= 80 ? 'Great' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work';

  container.innerHTML = `
    <div class="page page--analysis">
      <header class="page-header">
        <button class="btn-icon" id="backBtn" aria-label="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h2 class="page-header__title">Your Results</h2>
        <div style="width:40px"></div>
      </header>

      <div class="analysis__body">
        <!-- Score circle -->
        <div class="analysis__score-wrap" id="scoreMount"></div>

        <!-- Score label -->
        <div style="text-align:center; margin-top:-8px; margin-bottom:4px;">
          <span style="
            display:inline-block;
            background: var(--accent-glow);
            color: var(--accent);
            font-size:0.75rem;
            font-weight:700;
            text-transform:uppercase;
            letter-spacing:1px;
            border-radius:6px;
            padding:3px 10px;
          ">${scoreLabel}</span>
        </div>

        <!-- AI Summary -->
        <div class="card analysis__summary-card">
          <p class="analysis__summary-title">AI Summary</p>
          <p class="analysis__summary-text">${escapeHtml(summary || 'Analysis complete. See issues below for details.')}</p>
        </div>

        <!-- Issues list -->
        <div class="card">
          <p class="analysis__issues-title">Issues Found (${Array.isArray(issues) ? issues.length : 0})</p>
          <ul class="issues-list" aria-label="Organization issues">
            ${Array.isArray(issues) && issues.length > 0
              ? issues.map(issue => `
                  <li class="issues-list__item">
                    <span class="issues-list__dot" aria-hidden="true"></span>
                    <span>${escapeHtml(issue)}</span>
                  </li>
                `).join('')
              : '<li class="issues-list__item"><span>No major issues detected — great job!</span></li>'
            }
          </ul>
        </div>

        <!-- CTA -->
        <button class="btn btn--primary btn--full" id="recsBtn">
          View Recommendations
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  document.getElementById('backBtn').addEventListener('click', goBack);

  // Mount animated score circle
  const scoreMount = document.getElementById('scoreMount');
  scoreMount.appendChild(createScoreCircle(score || 0));

  // Load product recommendations
  document.getElementById('recsBtn').addEventListener('click', async () => {
    const btn = document.getElementById('recsBtn');
    btn.disabled = true;
    btn.innerHTML = `
      <div class="spinner" style="width:18px;height:18px;border-width:2px;" aria-hidden="true"></div>
      Finding products…
    `;

    try {
      const recs = await searchProducts(Array.isArray(issues) ? issues : []);
      sessionStorage.setItem('recommendations', JSON.stringify(recs));
      navigate('#/recommendations');
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = `View Recommendations
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>`;
      alert(`Could not load recommendations: ${err.message}`);
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
