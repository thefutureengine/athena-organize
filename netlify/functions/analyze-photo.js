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
  "summary": "<2-3 concise sentences summarizing the space's organization state and top improvement suggestions>"
}

Scoring guide:
- 90-100: Immaculate, minimal, everything in its place
- 70-89: Good overall with minor issues
- 50-69: Moderate clutter or inefficiency
- 30-49: Significant disorganization
- 0-29: Major overhaul needed`,
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
