import { supabase } from '../supabase.js';

/**
 * Insights page — aggregate metrics: avg score, total scans, best score,
 * and a bar chart of the most common issue categories.
 * @param {HTMLElement} container
 */
export async function renderInsights(container) {
  container.innerHTML = `
    <div class="page page--insights">
      <header class="page-header page-header--static">
        <h2 class="page-header__title">Insights</h2>
      </header>

      <div class="insights__body" id="insightsBody">
        <div class="insights__metrics">
          <div class="skeleton skeleton--card metric-card" style="height:88px;"></div>
          <div class="skeleton skeleton--card metric-card" style="height:88px;"></div>
          <div class="skeleton skeleton--card metric-card" style="height:88px;"></div>
        </div>
        <div class="skeleton" style="height:200px;border-radius:12px;"></div>
      </div>
    </div>
  `;

  try {
    const [projectsRes, analysesRes] = await Promise.all([
      supabase.from('athena_projects').select('score, created_at', { count: 'exact' }),
      supabase.from('athena_analyses').select('issues'),
    ]);

    const projects = projectsRes.data || [];
    const analyses = analysesRes.data || [];

    const totalScans   = projects.length;
    const validScores  = projects.filter(p => p.score !== null && p.score !== undefined).map(p => p.score);
    const avgScore     = validScores.length > 0
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : 0;
    const bestScore    = validScores.length > 0 ? Math.max(...validScores) : 0;

    // Aggregate issue categories
    const issueCounts = {};
    analyses.forEach(row => {
      const issues = Array.isArray(row.issues) ? row.issues : [];
      issues.forEach(issue => {
        const cat = categorizeIssue(String(issue));
        issueCounts[cat] = (issueCounts[cat] || 0) + 1;
      });
    });

    const topIssues = Object.entries(issueCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);

    const maxCount = topIssues.length > 0 ? topIssues[0][1] : 1;

    const body = document.getElementById('insightsBody');
    if (!body) return;

    body.innerHTML = `
      <!-- Metric cards -->
      <div class="insights__metrics">
        <div class="metric-card card">
          <p class="metric-card__value">${totalScans}</p>
          <p class="metric-card__label">Total Scans</p>
        </div>
        <div class="metric-card card">
          <p class="metric-card__value" style="color:${scoreColor(avgScore)}">${avgScore}</p>
          <p class="metric-card__label">Avg Score</p>
        </div>
        <div class="metric-card card">
          <p class="metric-card__value" style="color:#4CAF50">${bestScore}</p>
          <p class="metric-card__label">Best Score</p>
        </div>
      </div>

      <!-- Common issues chart -->
      <div class="card">
        <p class="insights__section-title">Common Issues</p>
        ${topIssues.length > 0
          ? topIssues.map(([category, count]) => `
              <div class="issue-bar" role="listitem">
                <div class="issue-bar__label">
                  <span>${escapeHtml(category)}</span>
                  <span>${count}</span>
                </div>
                <div class="issue-bar__track" aria-label="${escapeHtml(category)}: ${count}">
                  <div class="issue-bar__fill" style="width:0%" data-width="${Math.round((count / maxCount) * 100)}%"></div>
                </div>
              </div>
            `).join('')
          : '<p class="empty-state__text" style="font-size:0.875rem;padding:16px 0;">No issue data yet. Complete a scan to see insights.</p>'
        }
      </div>

      ${totalScans === 0 ? `
        <div class="empty-state" style="padding:24px;">
          <p class="empty-state__text">Scan your first space to start building insights!</p>
          <button class="btn btn--primary" onclick="window.location.hash='#/camera'">Scan Now</button>
        </div>
      ` : ''}
    `;

    // Animate issue bars after paint
    requestAnimationFrame(() => {
      setTimeout(() => {
        body.querySelectorAll('.issue-bar__fill').forEach(el => {
          el.style.width = el.dataset.width;
        });
      }, 100);
    });

  } catch (err) {
    console.error('[Athena] Insights error:', err);
    const body = document.getElementById('insightsBody');
    if (body) {
      body.innerHTML = `
        <div class="empty-state">
          <p class="empty-state__text">Could not load insights. Check your Supabase configuration.</p>
        </div>
      `;
    }
  }
}

/** Map a raw issue string to a readable category name. */
function categorizeIssue(issue) {
  const lower = issue.toLowerCase();
  if (lower.includes('clutter') || lower.includes('messy') || lower.includes('cluttered')) return 'Clutter';
  if (lower.includes('storage') || lower.includes('organiz') || lower.includes('shelf')) return 'Storage';
  if (lower.includes('light') || lower.includes('dark') || lower.includes('bright')) return 'Lighting';
  if (lower.includes('cable') || lower.includes('wire') || lower.includes('cord')) return 'Cable Management';
  if (lower.includes('dust') || lower.includes('clean') || lower.includes('dirt')) return 'Cleanliness';
  if (lower.includes('space') || lower.includes('crowd') || lower.includes('cramped')) return 'Space Utilization';
  if (lower.includes('color') || lower.includes('colour') || lower.includes('aesthetic')) return 'Aesthetics';
  return 'Other';
}

function scoreColor(score) {
  if (score >= 80) return '#4CAF50';
  if (score >= 60) return '#FF9800';
  return '#E91E63';
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
