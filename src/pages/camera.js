import { analyzePhoto } from '../api.js';

/**
 * Camera page — capture or upload a photo, optionally enter room dimensions,
 * then send for AI analysis. Image and controls are stacked (no absolute
 * overlay); measurement section is collapsible and inline.
 */
export function cameraPage() {
  const container = document.createElement('div');
  container.className = 'page camera-page';

  let selectedFile = null;
  let analyzing = false;
  let currentUnit = 'ft';

  container.innerHTML = `
    <div class="camera-page__title">
      <h2>Scan Your Space</h2>
      <p>Photograph any cluttered area for an instant AI score</p>
    </div>

    <div class="camera-dropzone" id="dropzone" role="button" tabindex="0"
         aria-label="Tap to capture or upload a photo">
      <div class="camera-dropzone__icon" aria-hidden="true">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M13.5 6L11.25 9H6C4.35 9 3 10.35 3 12V27C3 28.65 4.35 30 6 30H30C31.65 30 33 28.65 33 27V12C33 10.35 31.65 9 30 9H24.75L22.5 6H13.5Z"
                stroke="white" stroke-width="2" stroke-linejoin="round" fill="none"/>
          <circle cx="18" cy="19.5" r="5.25" stroke="white" stroke-width="2"/>
          <circle cx="27" cy="13.5" r="1.5" fill="white"/>
        </svg>
      </div>
      <div class="camera-dropzone__copy">
        <strong>Tap to capture or upload</strong>
        <span>Point your camera at any cluttered space</span>
      </div>
      <div class="camera-dropzone__hint">JPG, PNG, HEIC · Max 10 MB</div>
      <input type="file" id="camera-input" accept="image/*" capture="environment">
    </div>

    <section class="camera-preview" id="previewWrap" hidden>
      <div class="camera-preview__media">
        <img id="previewImg" src="" alt="Selected photo preview">
        <button class="camera-preview__retake" id="retakeBtn" type="button" aria-label="Retake photo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
          </svg>
          Retake
        </button>
      </div>

      <details class="measure-section">
        <summary>
          <span class="measure-section__lead">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 6H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1Z"/>
              <path d="M7 6v3M11 6v3M15 6v3M19 6v3"/>
            </svg>
            Add room dimensions
          </span>
          <span class="measure-section__hint">Optional · filters products to ones that fit</span>
        </summary>
        <div class="measure-grid">
          <label class="measure-field">
            <span>Width</span>
            <input type="number" min="0" step="0.1" inputmode="decimal" id="measureWidth" placeholder="—">
          </label>
          <label class="measure-field">
            <span>Depth</span>
            <input type="number" min="0" step="0.1" inputmode="decimal" id="measureDepth" placeholder="—">
          </label>
          <label class="measure-field">
            <span>Height</span>
            <input type="number" min="0" step="0.1" inputmode="decimal" id="measureHeight" placeholder="—">
          </label>
          <div class="measure-units" role="radiogroup" aria-label="Measurement unit">
            <button type="button" class="measure-units__btn is-active" data-unit="ft" aria-pressed="true">ft</button>
            <button type="button" class="measure-units__btn" data-unit="m" aria-pressed="false">m</button>
          </div>
        </div>
        <p class="measure-section__note">
          Tip: use your phone Measure app (iOS) or an AR ruler (Android), then enter the values here. We drop products that won't fit before showing recommendations.
        </p>
      </details>

      <button class="btn btn--primary btn--full camera-preview__analyze" id="analyzeBtn" type="button">
        Analyze Space
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </section>

    <div id="analyzingState" hidden>
      <div class="loading-state card">
        <div class="spinner">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="14" stroke="rgba(255,255,255,0.1)" stroke-width="3"/>
            <path d="M32 18 A14 14 0 0 0 18 4" stroke="#E91E63" stroke-width="3" stroke-linecap="round"/>
          </svg>
        </div>
        <p>Athena is analyzing your space…</p>
        <span class="text-muted" style="font-size:0.78rem">This takes about 10 seconds</span>
      </div>
    </div>

    <div id="errorState" class="error-state" hidden></div>

    <aside class="card tips-card" id="tipsCard">
      <p class="tips-card__title">Tips for best results</p>
      <ul class="tips-card__list">
        <li><span>💡</span><span>Good lighting — open a window or turn on lights</span></li>
        <li><span>📐</span><span>Include the full area — step back to show the whole space</span></li>
        <li><span>🔍</span><span>Keep it steady — avoid blur for accurate analysis</span></li>
      </ul>
    </aside>
  `;

  const dropzone     = container.querySelector('#dropzone');
  const fileInput    = container.querySelector('#camera-input');
  const previewWrap  = container.querySelector('#previewWrap');
  const previewImg   = container.querySelector('#previewImg');
  const retakeBtn    = container.querySelector('#retakeBtn');
  const analyzeBtn   = container.querySelector('#analyzeBtn');
  const analyzingEl  = container.querySelector('#analyzingState');
  const errorEl      = container.querySelector('#errorState');
  const tipsCard     = container.querySelector('#tipsCard');
  const widthInput   = container.querySelector('#measureWidth');
  const depthInput   = container.querySelector('#measureDepth');
  const heightInput  = container.querySelector('#measureHeight');
  const unitButtons  = container.querySelectorAll('.measure-units__btn');

  unitButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentUnit = btn.dataset.unit;
      unitButtons.forEach(b => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });
    });
  });

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) {
      showError('Image must be smaller than 10 MB.');
      return;
    }
    selectedFile = file;
    previewImg.src = URL.createObjectURL(file);
    previewWrap.hidden = false;
    dropzone.hidden = true;
    tipsCard.hidden = true;
    errorEl.hidden = true;
  }

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
  });
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  });

  retakeBtn.addEventListener('click', () => {
    selectedFile = null;
    fileInput.value = '';
    previewImg.src = '';
    previewWrap.hidden = true;
    dropzone.hidden = false;
    tipsCard.hidden = false;
    errorEl.hidden = true;
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  });

  analyzeBtn.addEventListener('click', async () => {
    if (!selectedFile || analyzing) return;
    analyzing = true;

    previewWrap.hidden = true;
    analyzingEl.hidden = false;
    errorEl.hidden = true;

    const w = parseFloat(widthInput.value);
    const d = parseFloat(depthInput.value);
    const h = parseFloat(heightInput.value);
    const hasAny = [w, d, h].some(n => Number.isFinite(n) && n > 0);
    const measurements = hasAny
      ? {
          width:  Number.isFinite(w) && w > 0 ? w : null,
          depth:  Number.isFinite(d) && d > 0 ? d : null,
          height: Number.isFinite(h) && h > 0 ? h : null,
          unit: currentUnit,
        }
      : null;

    try {
      const imageBase64 = await fileToBase64(selectedFile);
      const result = await analyzePhoto({ imageBase64, mimeType: selectedFile.type });

      sessionStorage.setItem('athena_analysis', JSON.stringify(result));
      sessionStorage.setItem('athena_photo_base64', imageBase64);
      sessionStorage.setItem('athena_photo_mime', selectedFile.type);
      if (measurements) {
        sessionStorage.setItem('athena_measurements', JSON.stringify(measurements));
      } else {
        sessionStorage.removeItem('athena_measurements');
      }

      window.location.hash = '#/analysis';
    } catch (err) {
      showError(err.message || 'Analysis failed. Please try again.');
      previewWrap.hidden = false;
      analyzingEl.hidden = true;
      analyzing = false;
    }
  });

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  return container;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = typeof result === 'string' && result.includes(',')
        ? result.split(',')[1]
        : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}
