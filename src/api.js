/**
 * Fetch wrappers for the four Netlify Functions.
 * All functions are POST, return JSON, and handle CORS.
 */

const BASE = '/.netlify/functions';

/**
 * Internal fetch helper with error handling.
 */
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
 * Sends a base64-encoded image to Claude for organization analysis.
 * @param {string} imageBase64 - Raw base64 image data (no data: prefix)
 * @returns {{ score: number, issues: string[], summary: string }}
 */
export async function analyzePhoto(imageBase64) {
  return apiFetch('analyze-photo', { imageBase64 });
}

/**
 * POST /search-products
 * Asks Claude to generate product recommendations for the given issues.
 * @param {string[]} issues - Array of issue strings from analysis
 * @returns {Array<{ name: string, price: string, retailer: string, link: string, thumbnail: string }>}
 */
export async function searchProducts(issues) {
  return apiFetch('search-products', { issues });
}

/**
 * POST /generate-images
 * Calls DALL-E 3 to generate an organized "after" version of the space.
 * @param {string} originalImageBase64 - Original captured image (base64)
 * @param {string} planSummary - AI-generated summary of improvements
 * @returns {{ afterImageUrl: string }}
 */
export async function generateImages(originalImageBase64, planSummary) {
  return apiFetch('generate-images', { originalImageBase64, planSummary });
}

/**
 * POST /save-project
 * Persists the project and its analysis to Supabase.
 * @param {object} project - { name, score, status }
 * @param {object} analysis - { issues, recommendations, after_image_url }
 * @returns {{ projectId: string, analysisId: string }}
 */
export async function saveProject(project, analysis) {
  return apiFetch('save-project', { project, analysis });
}
