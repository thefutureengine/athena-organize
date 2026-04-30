const BASE = '/.netlify/functions';

/**
 * Generic POST helper for all Netlify functions.
 * Throws a descriptive Error on non-2xx responses.
 */
async function callFunction(name, body) {
  const res = await fetch(`${BASE}/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      message = data.error || message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return res.json();
}

/**
 * POST {imageBase64} → { score, issues, summary }
 * Calls Claude vision to analyze the space.
 */
export async function analyzePhoto(imageBase64) {
  return callFunction('analyze-photo', { imageBase64 });
}

/**
 * POST {issues} → { products: [{name, price, retailer, link, thumbnail}] }
 * Calls Claude to generate relevant product recommendations.
 */
export async function searchProducts(issues) {
  return callFunction('search-products', { issues });
}

/**
 * POST {originalImageBase64, planSummary} → { afterImageUrl }
 * Calls DALL-E 3 to generate an "after" visualization.
 */
export async function generateImages(originalImageBase64, planSummary) {
  return callFunction('generate-images', { originalImageBase64, planSummary });
}

/**
 * POST {project, analysis} → { projectId, analysisId }
 * Saves the project and analysis to Supabase via the function.
 */
export async function saveProject(project, analysis) {
  return callFunction('save-project', { project, analysis });
}
