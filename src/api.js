/**
 * Fetch wrappers for the four Netlify Functions.
 * All functions are POST, return JSON, and handle CORS.
 *
 * All wrappers accept a single options object so call sites can pass
 * named fields without worrying about positional order.
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

/**
 * POST /analyze-photo
 * @param {{imageBase64: string, mimeType?: string}} opts
 * @returns {Promise<{score: number, issues: string[], summary: string}>}
 */
export async function analyzePhoto({ imageBase64, mimeType }) {
  return apiFetch('analyze-photo', { imageBase64, mimeType });
}

/**
 * POST /search-products
 * @param {{issues: string[]}} opts
 * @returns {Promise<{recommendations: object[]}>}
 */
export async function searchProducts({ issues }) {
  return apiFetch('search-products', { issues });
}

/**
 * POST /generate-images
 * @param {{originalImageBase64?: string, planSummary: string}} opts
 * @returns {Promise<{afterImageUrl: string}>}
 */
export async function generateImages({ originalImageBase64, planSummary }) {
  return apiFetch('generate-images', { originalImageBase64, planSummary });
}

/**
 * POST /save-project
 * @param {{project: object, analysis: object}} opts
 * @returns {Promise<{projectId: string, analysisId: string}>}
 */
export async function saveProject({ project, analysis }) {
  return apiFetch('save-project', { project, analysis });
}
