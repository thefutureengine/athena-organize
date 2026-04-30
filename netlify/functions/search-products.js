/**
 * Netlify Function: search-products
 *
 * POST { issues: string[] }
 * → Array<{ name: string, price: string, retailer: string, link: string, thumbnail: string }>
 *
 * Uses Anthropic Claude to generate relevant product recommendations
 * based on the identified organization issues. Claude uses its knowledge
 * of real, widely-available products to provide accurate recommendations
 * with realistic current prices.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type':                 'application/json',
};

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  let issues;
  try {
    ({ issues } = JSON.parse(event.body || '{}'));
  } catch {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  if (!Array.isArray(issues)) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'issues must be an array of strings' }),
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'ANTHROPIC_API_KEY environment variable is not set' }),
    };
  }

  try {
    const AnthropicModule = require('@anthropic-ai/sdk');
    const Anthropic = AnthropicModule.default || AnthropicModule;
    const client = new Anthropic({ apiKey });

    const issuesList = issues.length > 0
      ? issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')
      : 'General clutter and disorganization';

    const message = await client.messages.create({
      model:      'claude-opus-4-5',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `You are a professional organizer recommending real products available on Amazon, IKEA, The Container Store, or similar major retailers.

Based on these organization issues:
${issuesList}

Recommend 6-8 specific, real products that would help resolve these issues.

Respond with ONLY a raw JSON array — no markdown, no code fences, no extra text:
[
  {
    "name": "<specific product name and model/variant>",
    "price": "<realistic current price e.g. '$24.99' or '$12–$18'>",
    "retailer": "<Amazon | IKEA | The Container Store | Target | Walmart | etc.>",
    "link": "<real product URL — use the retailer's actual product page URL format>",
    "thumbnail": "<leave empty string — thumbnails are not available>"
  }
]

Rules:
- Recommend products that are widely available and actually sold at the named retailer
- Use realistic 2024 prices
- Mix price points (budget to mid-range)
- Each product should directly address one or more of the listed issues
- Keep product names concise but specific enough to identify the item`,
        },
      ],
    });

    const rawText = message.content[0].text.trim();
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Claude response did not contain a valid JSON array');
    }

    const products = JSON.parse(jsonMatch[0]);

    // Validate and sanitize each product
    const sanitized = products
      .filter(p => p && typeof p === 'object')
      .map(p => ({
        name:      String(p.name      || 'Organization Product'),
        price:     String(p.price     || 'Price varies'),
        retailer:  String(p.retailer  || 'Amazon'),
        link:      String(p.link      || 'https://amazon.com/s?k=organization+products'),
        thumbnail: '', // Future: integrate a product image API
      }))
      .slice(0, 8);

    return {
      statusCode: 200,
      headers:    CORS_HEADERS,
      body:       JSON.stringify(sanitized),
    };

  } catch (err) {
    console.error('[search-products] Error:', err);
    return {
      statusCode: 500,
      headers:    CORS_HEADERS,
      body:       JSON.stringify({ error: err.message || 'Product search failed. Please try again.' }),
    };
  }
};
