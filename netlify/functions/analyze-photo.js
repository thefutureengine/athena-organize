/**
 * Netlify Function: analyze-photo
 *
 * POST { imageBase64: string }
 * → { score: number, issues: string[], summary: string }
 *
 * Calls Anthropic Claude with vision to analyze an uploaded space photo
 * for organization and efficiency issues.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type':                 'application/json',
};

exports.handler = async function (event) {
  // Handle CORS preflight
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

  let imageBase64;
  try {
    ({ imageBase64, mimeType } = JSON.parse(event.body || '{}'));
  } catch {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  if (!imageBase64) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'imageBase64 is required' }),
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
    // Dynamically require the Anthropic SDK (bundled by esbuild)
    const AnthropicModule = require('@anthropic-ai/sdk');
    const Anthropic = AnthropicModule.default || AnthropicModule;
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type:   'image',
              source: {
                type:       'base64',
                media_type: (mimeType || 'image/jpeg'),
                data:       imageBase64,
              },
            },
            {
              type: 'text',
              text: `You are an expert professional organizer. Analyze this photograph of a space.

Respond with ONLY a raw JSON object — no markdown, no code fences, no extra text. Use this exact structure:
{
  "score": <integer 0-100, where 100 is perfectly organized>,
  "issues": [<up to 8 specific, actionable issue strings, each under 80 chars>],
  "summary": "<2-3 concise sentences summarizing the space organization state and top improvement suggestions>",
  "estimatedDimensions": { "width": <number>, "depth": <number>, "height": <number>, "unit": "in"|"ft"|"cm"|"m", "confidence": "high"|"medium"|"low", "referenceUsed": "credit_card"|"dollar_bill"|"iphone"|"ruler"|"hand"|null } | null
}

Scoring guide:
- 90-100: Immaculate, minimal, everything in its place
- 70-89: Good overall with minor issues
- 50-69: Moderate clutter or inefficiency
- 30-49: Significant disorganization
- 0-29: Major overhaul needed

REFERENCE-OBJECT MEASUREMENT (estimatedDimensions field):
If you can confidently identify a known-size reference object in the frame, use it to estimate the dimensions of the DOMINANT surface, shelf, drawer, or container shown.

Reference object true sizes:
- credit_card: 3.37 x 2.13 inches (8.56 x 5.40 cm)
- dollar_bill: 6.14 x 2.61 inches (15.6 x 6.6 cm)
- iphone:      ~6 x 3 inches (depending on model — assume ~5.8 x 2.8 in)
- ruler:       12 in or 30 cm depending on type — read the markings if visible
- hand:        last resort, very low confidence — average adult hand ~7.5 in long

Rules for estimatedDimensions:
1. If NO recognizable reference object is in the frame, set the entire estimatedDimensions value to null. Do NOT guess.
2. Estimate the dimensions of whatever organizational surface is the focus (the shelf, the drawer interior, the desk, the closet section, etc.) — not the whole room unless the room is the subject.
3. Prefer "in" or "ft" unit if the reference is credit_card or dollar_bill or iphone; use "cm"/"m" if a metric ruler is the reference.
4. Confidence guide:
   - high: clear unobstructed reference object, perpendicular to camera, full surface visible.
   - medium: reference partially occluded or angled, surface mostly visible.
   - low: reference small in frame, heavy parallax, or hand used as reference.
5. Only return depth and height when you can actually see those axes. Set the ones you cannot estimate to null. width is the easiest single dimension and may be all you can give.
6. If you DO produce dimensions, double-check the magnitude is plausible (e.g., a desk shelf is unlikely to be 50ft wide — if your math gives implausible numbers, return null instead).`,
            },
          ],
        },
      ],
    });

    const rawText = message.content[0].text.trim();

    // Extract JSON from response (handle any surrounding whitespace or text)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Claude response did not contain valid JSON');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate and sanitize the result
    const sanitized = {
      score:   Math.min(100, Math.max(0, Math.round(Number(result.score) || 0))),
      issues:  Array.isArray(result.issues) ? result.issues.slice(0, 8).map(String) : [],
      summary: String(result.summary || 'Analysis complete.'),
      estimatedDimensions: sanitizeEstimatedDimensions(result.estimatedDimensions),
    };

    return {
      statusCode: 200,
      headers:    CORS_HEADERS,
      body:       JSON.stringify(sanitized),
    };

  } catch (err) {
    console.error('[analyze-photo] Error:', err);
    return {
      statusCode: 500,
      headers:    CORS_HEADERS,
      body:       JSON.stringify({ error: err.message || 'Analysis failed. Please try again.' }),
    };
  }
};

/**
 * Validate and clean the estimatedDimensions field. Returns null if the
 * model didn't produce a usable estimate.
 */
function sanitizeEstimatedDimensions(d) {
  if (!d || typeof d !== 'object') return null;

  const validUnit = ['in', 'ft', 'cm', 'm'].includes(d.unit) ? d.unit : null;
  const validConf = ['high', 'medium', 'low'].includes(d.confidence) ? d.confidence : null;
  const validRef  = ['credit_card', 'dollar_bill', 'iphone', 'ruler', 'hand'].includes(d.referenceUsed) ? d.referenceUsed : null;

  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 && n < 1e4 ? Math.round(n * 100) / 100 : null;
  };

  const w = num(d.width);
  const dp = num(d.depth);
  const h = num(d.height);

  if (!validUnit || !validRef) return null;
  if (w == null && dp == null && h == null) return null;

  return {
    width: w,
    depth: dp,
    height: h,
    unit: validUnit,
    confidence: validConf || 'low',
    referenceUsed: validRef,
  };
}

