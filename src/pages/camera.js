import { analyzePhoto } from '../api.js';

/**
 * Camera page — prominent dashed-gradient drop zone, native capture support,
 * drag-and-drop, image preview, and analysis trigger.
 */
export function cameraPage() {
  const container = document.createElement('div');
  container.className = 'page camera-page';

  let selectedFile = null;
  let analyzing = false;

  container.innerHTML = `
    <div class="camera-page__title">
      <h2>Scan Your Space</h2>
      <p>Photograph any cluttered area for an instant AI score</p>
    </div>

    <!-- Drop zone -->
    <div class="camera-dropzone" id="dropzone" role="button" tabindex="0"
         aria-label="Tap to capture or upload a photo">
      <div class="camera-dropzone__icon" id="shutterBtn" aria-hidden="true">
        <!-- Camera SVG icon -->
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
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

      <div class="camera-dropzone__hint">Supports JPG, PNG, HEIC · Max 10 MB</div>

      <input type="file" id="camera-input" accept="image/*" capture="environment">
    </div>

    <!-- Image preview (hidden until file selected) -->
    <div class="camera-preview card" id="previewWrap" style="display:none">
      <img id="previewImg" src="" alt="Selected photo preview">
      <div class="camera-preview__controls">
        <button class="btn btn--secondary" id="retakeBtn" style="flex:1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
          Retake
        </button>
        <button class="btn btn--primary" id="analyzeBtn" style="flex:2">
          Analyze Space →
        </button>
      </div>
    </div>

    <!-- Analyzing state (hidden) -->
    <div id="analyzingState" style="display:none">
      <div class="loading-state card">
        <div class="spinner">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="18" cy="18" r="14" stroke="rgba(255,255,255,0.1)" stroke-width="3"/>
            <path d="M32 18 A14 14 0 0 0 18 4" stroke="#E91E63" stroke-width="3" stroke-linecap="round"/>
          </svg>
        </div>
        <p>Athena is analyzing your space…</p>
        <span class="text-muted" style="font-size:0.78rem">This takes about 10 seconds</span>
      </div>
    </div>

    <!-- Error state (hidden) -->
    <div id="errorState" class="error-state" style="display:none"></div>

    <!-- Tips -->
    <div class="card" id="tipsCard">
      <p style="font-size:0.78rem;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-sec);margin-bottom:12px;">Tips for best results</p>
      <ul style="list-style:none;display:flex;flex-direction:column;gap:8px;">
        <li style="display:flex;gap:8px;align-items:flex-start;font-size:0.85rem;color:var(--text-sec);">
          <span>💡</span><span>Good lighting — open a window or turn on lights</span>
        </li>
        <li style="display:flex;gap:8px;align-items:flex-start;font-size:0.85rem;color:var(--text-sec);">
          <span>📐</span><span>Include the full area — step back to show the whole space</span>
        </li>
        <li style="display:flex;gap:8px;align-items:flex-start;font-size:0.85rem;color:var(--text-sec);">
          <span>🔍</span><span>Keep it steady — avoid blur for accurate analysis</span>
        </li>
      </ul>
    </div>
  `;

  // Elements
  const dropzone     = container.querySelector('#dropzone');
  const fileInput    = container.querySelector('#camera-input');
  const previewWrap  = container.querySelector('#previewWrap');
  const previewImg   = container.querySelector('#previewImg');
  const retakeBtn    = container.querySelector('#retakeBtn');
  const analyzeBtn   = container.querySelector('#analyzeBtn');
  const analyzingEl  = container.querySelector('#analyzingState');
  const errorEl      = container.querySelector('#errorState');
  const tipsCard     = container.querySelector('#tipsCard');

  // ── File selection ──────────────────────────────────────────────
  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) {
      showError('Image must be smaller than 10 MB. Please choose a smaller file.');
      return;
    }
    selectedFile = file;
    const url = URL.createObjectURL(file);
    previewImg.src = url;
    previewWrap.style.display = 'block';
    dropzone.style.display = 'none';
    tipsCard.style.display = 'none';
    errorEl.style.display = 'none';
  }

  // Click / tap drop zone
  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  });

  // Retake
  retakeBtn.addEventListener('click', () => {
    selectedFile = null;
    fileInput.value = '';
    previewImg.src = '';
    previewWrap.style.display = 'none';
    dropzone.style.display = 'flex';
    tipsCard.style.display = 'block';
    errorEl.style.display = 'none';
  });

  // ── Drag and drop ───────────────────────────────────────────────
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

  // ── Analyze ─────────────────────────────────────────────────────
  analyzeBtn.addEventListener('click', async () => {
    if (!selectedFile || analyzing) return;
    analyzing = true;

    previewWrap.style.display = 'none';
    analyzingEl.style.display = 'block';
    errorEl.style.display = 'none';

    try {
      const imageBase64 = await fileToBase64(selectedFile);
      const result = await analyzePhoto({ imageBase64, mimeType: selectedFile.type });

      // Store result in sessionStorage for the analysis page to pick up
      sessionStorage.setItem('athena_analysis', JSON.stringify(result));
      sessionStorage.setItem('athena_photo_base64', imageBase64);
      sessionStorage.setItem('athena_photo_mime', selectedFile.type);

      // Navigate to analysis page
      window.location.hash = '#/analysis';
    } catch (err) {
      showError(err.message || 'Analysis failed. Please try again.');
      previewWrap.style.display = 'block';
      analyzingEl.style.display = 'none';
      analyzing = false;
    }
  });

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  }

  return container;
}

// ── Helpers ──────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Strip data URL prefix — send raw base64
      const result = reader.result;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}
