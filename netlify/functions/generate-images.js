/**
 * generate-images Netlify Function
 *
 * POST { originalImageBase64?: string, planSummary: string }
 * → { afterImageUrl: string }
 *
 * IMPORTANT: DALL-E cannot reconstruct the user's literal space from a photo.
 * We generate an aspirational, photorealistic inspiration image of a well-organised
 * space based on the analysis summary — clearly framed as a "vision", not a
 * promise of what the user's specific space will look like.
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

  let planSummary;
  try {
    ({ planSummary } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  if (!planSummary || typeof planSummary !== 'string' || planSummary.trim().length === 0) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: 'planSummary is required and must be a non-empty string' }),
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'OPENAI_API_KEY not configured' }),
    };
  }

  // Build an aspirational prompt grounded in the analysis summary.
  // Explicitly framed as an inspirational vision — not a literal before/after.
  const dallePrompt = [
    'Create a photorealistic interior photograph of a beautifully organised living space.',
    'Style: clean minimalist organisation, warm natural light, tidy surfaces, calm atmosphere.',
    'The space should feel serene, functional, and aspirational — like a premium lifestyle magazine spread.',
    `Organisation inspiration based on analysis: ${planSummary.slice(0, 400).trim()}.`,
    'No clutter. Everything has a clear home. Neutral palette with subtle warm accents.',
    'Wide-angle perspective showing the full room. High-resolution, photographic quality.',
  ].join(' ');

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: dallePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI API error:', errText);
      return {
        statusCode: 502,
        headers: CORS,
        body: JSON.stringify({ error: 'Image generation failed', detail: errText }),
      };
    }

    const data = await response.json();
    const afterImageUrl = data.data?.[0]?.url;

    if (!afterImageUrl) {
      return {
        statusCode: 502,
        headers: CORS,
        body: JSON.stringify({ error: 'No image URL returned by OpenAI' }),
      };
    }

    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ afterImageUrl }),
    };
  } catch (err) {
    console.error('generate-images error:', err);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'Internal server error', message: err.message }),
    };
  }
};
