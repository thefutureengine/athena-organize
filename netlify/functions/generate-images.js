/**
 * Netlify Function: generate-images
 *
 * POST { originalImageBase64: string, planSummary: string }
 * → { afterImageUrl: string }
 *
 * Uses OpenAI DALL-E 3 to generate an "after" visualization of the space
 * based on the AI's organization plan summary.
 *
 * Note: DALL-E 3 does not accept image inputs (only GPT-4V / Vision models do).
 * We craft a detailed text prompt from the plan summary to generate a
 * realistic "after" visualization of an organized version of the space.
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

  let planSummary;
  try {
    ({ planSummary } = JSON.parse(event.body || '{}'));
  } catch {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  planSummary = String(planSummary || 'A beautifully organized, clutter-free living space');

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'OPENAI_API_KEY environment variable is not set' }),
    };
  }

  try {
    const OpenAIModule = require('openai');
    const OpenAI = OpenAIModule.default || OpenAIModule;
    const openai = new OpenAI({ apiKey });

    // Build a DALL-E 3 prompt from the plan summary
    const prompt = [
      'Professional interior design photograph, photorealistic, magazine quality.',
      'A beautifully organized, immaculately clean and clutter-free modern interior space.',
      `Organization plan applied: ${planSummary}`,
      'Everything is neatly arranged, labeled storage bins visible, clear surfaces,',
      'excellent lighting, warm and inviting atmosphere.',
      'Style: contemporary minimalist, neutral palette with natural light.',
      'No people in the image. Shot from a slightly elevated angle.',
    ].join(' ');

    const response = await openai.images.generate({
      model:           'dall-e-3',
      prompt:          prompt,
      n:               1,
      size:            '1024x1024',
      quality:         'standard',
      response_format: 'url',
    });

    const afterImageUrl = response.data[0].url;

    return {
      statusCode: 200,
      headers:    CORS_HEADERS,
      body:       JSON.stringify({ afterImageUrl }),
    };

  } catch (err) {
    console.error('[generate-images] Error:', err);

    // OpenAI errors often have a nested error object
    const message = err?.error?.message || err?.message || 'Image generation failed';

    return {
      statusCode: 500,
      headers:    CORS_HEADERS,
      body:       JSON.stringify({ error: message }),
    };
  }
};
