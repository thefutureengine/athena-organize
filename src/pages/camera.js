import { navigate, goBack } from '../router.js';
import { analyzePhoto } from '../api.js';

/**
 * Camera page — native file/camera input, preview, and analysis trigger.
 * @param {HTMLElement} container
 */
export function renderCamera(container) {
  container.innerHTML = `
    <div class="page page--camera">
      <header class="page-header">
        <button class="btn-icon" id="backBtn" aria-label="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <h2 class="page-header__title">Scan Space</h2>
        <div style="width:40px"></div>
      </header>

      <!-- Viewfinder / preview area -->
      <div class="camera__viewfinder" id="viewfinder">
        <div class="camera__preview-wrap" id="previewWrap">
          <img id="previewImg" class="camera__preview" alt="Selected photo" />
          <button class="camera__retake" id="retakeBtn" type="button">Retake</button>
        </div>
        <div class="camera__placeholder" id="cameraPlaceholder">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" aria-hidden="true">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <p>Tap the shutter or upload a photo of your space</p>
        </div>
      </div>

      <!-- Controls -->
      <div class="camera__controls">
        <!-- Gallery upload -->
        <label class="camera__gallery-btn" for="galleryInput" title="Upload from gallery" aria-label="Upload from gallery">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </label>
        <input type="file" id="galleryInput" accept="image/*" style="display:none;" aria-hidden="true" />

        <!-- Camera shutter (uses native camera on mobile) -->
        <label class="camera__shutter" for="cameraInput" aria-label="Take photo">
          <span class="camera__shutter-inner" aria-hidden="true"></span>
        </label>
        <input type="file" id="cameraInput" accept="image/*" capture="environment" style="display:none;" aria-hidden="true" />

        <!-- Analyze button, shown once image is selected -->
        <button class="btn btn--primary camera__analyze-btn" id="analyzeBtn" type="button" style="display:none;" aria-label="Analyze this space">
          Analyze
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      <!-- Loading overlay -->
      <div class="camera__loading" id="loadingOverlay" aria-live="polite">
        <div class="spinner" role="status" aria-label="Analyzing"></div>
        <p class="camera__loading-text">Analyzing your space…</p>
        <p class="camera__loading-sub">Claude AI is reviewing the photo — this takes 15–30 seconds</p>
      </div>
    </div>
  `;

  document.getElementById('backBtn').addEventListener('click', goBack);

  let imageBase64 = null;

  function showPreview(dataUrl) {
    document.getElementById('previewImg').src = dataUrl;
    document.getElementById('previewWrap').style.display = 'block';
    document.getElementById('cameraPlaceholder').style.display = 'none';
    const analyzeBtn = document.getElementById('analyzeBtn');
    analyzeBtn.style.display = 'flex';
  }

  function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target.result;
      // Strip the data:image/...;base64, prefix
      imageBase64 = result.split(',')[1];
      showPreview(result);
    };
    reader.readAsDataURL(file);
  }

  document.getElementById('cameraInput').addEventListener('change', e => {
    handleFile(e.target.files[0]);
  });
  document.getElementById('galleryInput').addEventListener('change', e => {
    handleFile(e.target.files[0]);
  });

  document.getElementById('retakeBtn').addEventListener('click', () => {
    imageBase64 = null;
    document.getElementById('previewWrap').style.display = 'none';
    document.getElementById('cameraPlaceholder').style.display = 'flex';
    document.getElementById('analyzeBtn').style.display = 'none';
    // Reset file inputs so same file can be re-selected
    document.getElementById('cameraInput').value = '';
    document.getElementById('galleryInput').value = '';
  });

  document.getElementById('analyzeBtn').addEventListener('click', async () => {
    if (!imageBase64) return;

    const overlay = document.getElementById('loadingOverlay');
    const analyzeBtn = document.getElementById('analyzeBtn');

    overlay.style.display = 'flex';
    analyzeBtn.disabled = true;

    try {
      const result = await analyzePhoto(imageBase64);
      // Persist results for analysis page
      sessionStorage.setItem('analysisResult', JSON.stringify(result));
      sessionStorage.setItem('capturedImageBase64', imageBase64);
      navigate('#/analysis');
    } catch (err) {
      overlay.style.display = 'none';
      analyzeBtn.disabled = false;
      alert(`Analysis failed: ${err.message}\n\nEnsure ANTHROPIC_API_KEY is set in your Netlify environment.`);
    }
  });
}
