/**
 * Fetch wrappers for the four Netlify Functions. All POST + JSON.
 * All wrappers take a single options object so call sites use named fields.
 */

const BASE = '/.netlify/functions';

async function apiFetch(endpoint, body) {
  let res;
  try {
    res = await fetch(`${BASE}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    throw new Error(`Network error: ${networkErr.message}`);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server returned non-JSON response (HTTP ${res.status})`);
  }

  if (!res.ok) {
    throw new Error(data?.error || `Server error: HTTP ${res.status}`);
  }

  return data;
}

/** POST /analyze-photo */
export async function analyzePhoto({ imageBase64, mimeType }) {
  return apiFetch('analyze-photo', { imageBase64, mimeType });
}

/**
 * POST /search-products
 * @param {{issues: string[], measurements?: object|null}} opts
 *   measurements (optional): { width, depth, height, unit } — when provided,
 *   the server filters recommendations to products that fit the measured space.
 */
export async function searchProducts({ issues, measurements = null }) {
  return apiFetch('search-products', { issues, measurements });
}

/** POST /generate-images */
export async function generateImages({ originalImageBase64, planSummary }) {
  return apiFetch('generate-images', { originalImageBase64, planSummary });
}

/** POST /save-project */
export async function saveProject({ project, analysis }) {
  return apiFetch('save-project', { project, analysis });
}
