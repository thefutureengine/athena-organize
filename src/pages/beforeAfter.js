import { navigate, goBack } from '../router.js';
import { createBeforeAfterSlider } from '../components/BeforeAfterSlider.js';
import { saveProject } from '../api.js';

/**
 * Before/After page — drag-to-reveal slider comparison + "Apply This Plan" save CTA.
 * @param {HTMLElement} container
 */
export function renderBeforeAfter(container) {
  const imageBase64 = sessionStorage.getItem('capturedImageBase64');
  const afterUrl    = sessionStorage.getItem('generatedAfterUrl');
  const analysis    = JSON.parse(sessionStorage.getItem('analysisResult') || '{}');
  const recs        = (() => {
    try { return JSON.parse(sessionStorage.getItem('recommendations') || '[]'); }
    catch { return []; }
  })();

  const beforeUrl    = imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : '';
  const afterImageUrl = afterUrl || 'https://placehold.co/600x450/242424/E91E63?text=After+%E2%9C%A8';

  container.innerHTML = `
    <div class="page page--before-after">
      <header class="page-header">
        <button class="btn-icon" id="backBtn" aria-label="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h2 class="page-header__title">Before &amp; After</h2>
        <div style="width:40px"></div>
      </header>

      <div class="ba__body">
        <p class="ba__hint">Drag the handle left or right to compare</p>
        <div id="sliderMount"></div>

        <div class="ba__actions">
          <button class="btn btn--primary btn--full" id="saveBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            Apply This Plan
          </button>
          <button class="btn btn--ghost btn--full" id="homeBtn">Back to Home</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('backBtn').addEventListener('click', goBack);
  document.getElementById('homeBtn').addEventListener('click', () => {
    window.location.hash = '#/';
  });

  // Mount the before/after slider
  const sliderMount = document.getElementById('sliderMount');
  if (beforeUrl) {
    sliderMount.appendChild(createBeforeAfterSlider(beforeUrl, afterImageUrl));
  } else {
    sliderMount.innerHTML = `
      <div class="ba__no-image">
        <p>No before image available.</p>
        <p style="margin-top:6px;font-size:0.8125rem;">Scan a space first to see a comparison.</p>
      </div>
    `;
  }

  // Save project + analysis to Supabase
  document.getElementById('saveBtn').addEventListener('click', async () => {
    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    btn.innerHTML = `
      <div class="spinner" style="width:18px;height:18px;border-width:2px;" aria-hidden="true"></div>
      Saving…
    `;

    try {
      const projectName = `Scan — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

      const projectPayload = {
        name: projectName,
        score: analysis.score || 0,
        status: 'analyzed',
        // photo_url omitted — base64-only round-trip; future work: upload to Supabase Storage
      };

      const analysisPayload = {
        issues:           analysis.issues || [],
        recommendations:  Array.isArray(recs) ? recs : [],
        after_image_url:  afterUrl || '',
      };

      const result = await saveProject(projectPayload, analysisPayload);

      btn.textContent = '✓ Plan Saved!';
      btn.classList.add('btn--success');
      btn.disabled = false;

      // Navigate home after brief confirmation
      setTimeout(() => {
        window.location.hash = '#/';
      }, 1800);

      return result;
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
        Apply This Plan`;
      alert(`Could not save plan: ${err.message}\n\nEnsure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your Netlify environment.`);
    }
  });
}
