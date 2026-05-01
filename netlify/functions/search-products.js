/**
 * search-products Netlify Function
 *
 * POST { issues: string[] }
 * → { recommendations: IssueRec[] }
 *
 * IssueRec = {
 *   issue: string,
 *   tiers: {
 *     good:   ProductItem,
 *     better: ProductItem,
 *     best:   ProductItem
 *   }
 * }
 *
 * ProductItem = { name, price, retailer, link, thumbnail }
 *
 * LINK POLICY: every link must be a deep product-page URL whose path slug
 * contains the product name. Domain-root or non-product URLs are dropped.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let issues;
  try {
    ({ issues } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  if (!Array.isArray(issues) || issues.length === 0) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: 'issues must be a non-empty array of strings' }),
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }) };
  }

  // Cap at 5 issues to manage prompt size and cost
  const limitedIssues = issues.slice(0, 5);

  const systemPrompt = `You are an expert home-organization product researcher with deep knowledge of
current products available on Amazon, The Container Store, IKEA, Target, Walmart, and other major retailers.

Your task: for each organization issue the user provides, recommend THREE tiered product options:
  - good   → budget-friendly (~$10–$30), practical, widely available
  - better → mid-range (~$30–$80), better quality or features
  - best   → premium (~$80+), best-in-class, long-lasting investment

CRITICAL LINK RULES — READ CAREFULLY:
1. Every "link" field MUST be a deep product-page URL. The URL path must contain a product-name slug or product ID. Examples of VALID links:
   - https://www.amazon.com/Sterilite-19636806-Medium-Weave-Basket/dp/B07PX2RD5L
   - https://www.containerstore.com/s/storage/desk-storage/stackable-letter-tray/123456
   - https://www.ikea.com/us/en/p/kallax-shelf-unit-white-00275783/
2. Domain-root or near-root URLs are FORBIDDEN and will be discarded. Never return:
   - https://www.amazon.com/
   - https://target.com
   - https://ikea.com/us/en/
3. If you cannot confidently provide a real deep product URL for a tier, OMIT that tier's product entirely (use null for that tier).
4. thumbnail should be a direct image URL ending in .jpg, .png, or .webp if available; otherwise use null.
5. price should be a formatted string like "$24.99" or "$149".

Return ONLY a valid JSON array (no markdown, no explanation). Schema:
[
  {
    "issue": "string — the exact issue text",
    "tiers": {
      "good":   { "name": "string", "price": "string", "retailer": "string", "link": "string", "thumbnail": "string|null" } | null,
      "better": { "name": "string", "price": "string", "retailer": "string", "link": "string", "thumbnail": "string|null" } | null,
      "best":   { "name": "string", "price": "string", "retailer": "string", "link": "string", "thumbnail": "string|null" } | null
    }
  }
]`;

  const userMessage = `Here are the organization issues found in this space. For each, provide good/better/best product recommendations with real, verified deep product-page links:

${limitedIssues.map((iss, i) => `${i + 1}. ${iss}`).join('\n')}

Remember: every link must be a deep product URL (with product name or ID in the path), not just a domain homepage.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', errText);
      return {
        statusCode: 502,
        headers: CORS,
        body: JSON.stringify({ error: 'AI service error', detail: errText }),
      };
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text || '[]';

    let parsed;
    try {
      // Strip any accidental markdown fences
      const clean = rawText.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
      parsed = JSON.parse(clean);
    } catch (parseErr) {
      console.error('Failed to parse Claude response:', rawText);
      return {
        statusCode: 502,
        headers: CORS,
        body: JSON.stringify({ error: 'Failed to parse AI response', raw: rawText }),
      };
    }

    if (!Array.isArray(parsed)) {
      return {
        statusCode: 502,
        headers: CORS,
        body: JSON.stringify({ error: 'Unexpected AI response shape', raw: rawText }),
      };
    }

    // ── JS-side URL validation ────────────────────────────────────
    // Drop any product whose link is a domain root (path is "/" or empty or just 1 segment)
    const validated = parsed.map((item) => {
      if (!item || typeof item !== 'object') return null;

      const tiers = {};
      for (const tier of ['good', 'better', 'best']) {
        const product = item.tiers?.[tier];
        if (!product || product === null) {
          tiers[tier] = null;
          continue;
        }

        const link = product.link || '';
        if (isDeepProductUrl(link)) {
          tiers[tier] = {
            name:      String(product.name || ''),
            price:     String(product.price || ''),
            retailer:  String(product.retailer || ''),
            link:      link,
            thumbnail: isValidImageUrl(product.thumbnail) ? product.thumbnail : null,
          };
        } else {
          // Drop products with shallow/invalid URLs
          console.warn(`Dropping product with shallow URL: ${link}`);
          tiers[tier] = null;
        }
      }

      return {
        issue: String(item.issue || ''),
        tiers,
      };
    }).filter(Boolean);

    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ recommendations: validated }),
    };
  } catch (err) {
    console.error('search-products error:', err);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'Internal server error', message: err.message }),
    };
  }
};

/**
 * Returns true only if the URL has a meaningful product path
 * (i.e., the pathname has at least 2 non-empty segments or contains a product identifier)
 */
function isDeepProductUrl(url) {
  if (!url || typeof url !== 'string') return false;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  // Must be http/https
  if (!['http:', 'https:'].includes(parsed.protocol)) return false;

  const pathname = parsed.pathname.replace(/\/+$/, ''); // strip trailing slash
  const segments = pathname.split('/').filter(Boolean);

  // Must have at least 2 path segments (e.g., /category/product-name)
  if (segments.length < 2) return false;

  // The last segment (product slug/ID) must be substantial (≥4 chars) — rules out /en/us/
  const lastSeg = segments[segments.length - 1];
  if (lastSeg.length < 4) return false;

  // Reject obvious category-level patterns with no product ID
  const genericPatterns = [/^search$/i, /^browse$/i, /^category$/i, /^shop$/i, /^products?$/i, /^store$/i];
  if (genericPatterns.some((p) => p.test(lastSeg))) return false;

  return true;
}

function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = new URL(url);
    return ['http:', 'https:'].includes(u.protocol);
  } catch {
    return false;
  }
}
