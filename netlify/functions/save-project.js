/**
 * Netlify Function: save-project
 *
 * POST { project: object, analysis: object }
 * → { projectId: string, analysisId: string }
 *
 * Inserts a new project and its analysis into Supabase using the
 * service role key (bypasses Row Level Security).
 *
 * Note on photo_url: Images are currently round-tripped as base64.
 * Persistent photo storage (uploading to Supabase Storage and saving
 * the resulting URL) is left as a future enhancement.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type':                 'application/json',
};

// Stub user ID — replace with real Supabase Auth user ID in a future iteration
const STUB_USER_ID = '00000000-0000-0000-0000-000000000001';

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

  let project, analysis;
  try {
    ({ project, analysis } = JSON.parse(event.body || '{}'));
  } catch {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  if (!project || typeof project !== 'object') {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'project object is required' }),
    };
  }

  const supabaseUrl      = process.env.SUPABASE_URL;
  const serviceRoleKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required',
      }),
    };
  }

  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Insert project row
    const { data: projectData, error: projectError } = await supabase
      .from('athena_projects')
      .insert([{
        name:      String(project.name  || 'Untitled Scan'),
        score:     Math.min(100, Math.max(0, Math.round(Number(project.score) || 0))),
        status:    String(project.status || 'analyzed'),
        photo_url: project.photo_url || null, // null until Supabase Storage integration
      }])
      .select('id')
      .single();

    if (projectError) {
      throw new Error(`Failed to insert project: ${projectError.message}`);
    }

    const projectId = projectData.id;

    // Insert analysis row linked to the project
    const analysisPayload = {
      project_id:        projectId,
      issues:            Array.isArray(analysis?.issues)          ? analysis.issues          : [],
      recommendations:   Array.isArray(analysis?.recommendations) ? analysis.recommendations : [],
      after_image_url:   String(analysis?.after_image_url  || ''),
      before_image_url:  String(analysis?.before_image_url || ''),
    };

    const { data: analysisData, error: analysisError } = await supabase
      .from('athena_analyses')
      .insert([analysisPayload])
      .select('id')
      .single();

    if (analysisError) {
      throw new Error(`Failed to insert analysis: ${analysisError.message}`);
    }

    return {
      statusCode: 201,
      headers:    CORS_HEADERS,
      body:       JSON.stringify({
        projectId:  projectId,
        analysisId: analysisData.id,
        message:    'Project saved successfully',
      }),
    };

  } catch (err) {
    console.error('[save-project] Error:', err);
    return {
      statusCode: 500,
      headers:    CORS_HEADERS,
      body:       JSON.stringify({ error: err.message || 'Failed to save project' }),
    };
  }
};
