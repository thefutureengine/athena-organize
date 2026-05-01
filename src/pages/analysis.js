import { navigate, goBack } from '../router.js';
import { createScoreCircle } from '../components/ScoreCircle.js';

/**
 * Analysis page — score circle, AI summary, bulleted issues list,
 * and CTA to load product recommendations.
 *
 * Reads the analysis result that camera.js stored under 'athena_analysis'
 * (the canonical key used app-wide). The recommendations page does its
 * own searchProducts fetch — this page just navigates.
 */
export function renderAnalysis(container) {
  const raw = sessionStorage.getItem('athena_analysis');

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
    container.querySelector('#backBtn').addEventListener('click', goBack);
    container.querySelector('#goScanBtn').addEventListener('click', () => navigate('#/camera'));
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

  // Surface measurements if user provided any
  let measurementsBadge = '';
  try {
    const m = JSON.parse(sessionStorage.getItem('athena_measurements') || 'null');
    if (m) {
      const parts = [];
      if (m.width)  parts.push(`W ${m.width}${m.unit}`);
      if (m.depth)  parts.push(`D ${m.depth}${m.unit}`);
      if (m.height) parts.push(`H ${m.height}${m.unit}`);
      if (parts.length) {
        measurementsBadge = `
          <div class="analysis__measurement-pill" aria-label="Room dimensions">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 7h18M3 17h18M7 7v10M17 7v10"/>
            </svg>
            <span>${parts.join(' · ')}</span>
          </div>
        `;
      }
    }
  } catch {}

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
        <div class="analysis__score-wrap" id="scoreMount"></div>

        <div class="analysis__score-meta">
          <span class="analysis__score-label">${scoreLabel}</span>
          ${measurementsBadge}
        </div>

        <div class="card analysis__summary-card">
          <p class="analysis__summary-title">AI Summary</p>
          <p class="analysis__summary-text">${escapeHtml(summary || 'Analysis complete. See issues below for details.')}</p>
        </div>

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

        <button class="btn btn--primary btn--full" id="recsBtn">
          View Recommendations
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  container.querySelector('#backBtn').addEventListener('click', goBack);

  const scoreMount = container.querySelector('#scoreMount');
  scoreMount.appendChild(createScoreCircle(score || 0));

  // Just navigate — recommendations page handles its own product fetch.
  container.querySelector('#recsBtn').addEventListener('click', () => {
    navigate('#/recommendations');
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
