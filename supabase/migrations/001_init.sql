-- Athena Organization Assistant — Database Schema
-- Run this in the Supabase SQL Editor for your project.

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Projects ────────────────────────────────────────────────────────────────
-- Each row represents one scanned space / organization project.

CREATE TABLE IF NOT EXISTS athena_projects (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL DEFAULT 'Untitled Scan',
  photo_url  TEXT,                          -- Future: URL to Supabase Storage upload
  score      INTEGER     CHECK (score >= 0 AND score <= 100),
  status     TEXT        NOT NULL DEFAULT 'analyzed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Analyses ─────────────────────────────────────────────────────────────────
-- Each analysis is linked 1:1 with a project.

CREATE TABLE IF NOT EXISTS athena_analyses (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID        NOT NULL REFERENCES athena_projects(id) ON DELETE CASCADE,
  issues           JSONB       NOT NULL DEFAULT '[]',          -- string[]
  recommendations  JSONB       NOT NULL DEFAULT '[]',          -- product recommendation objects
  before_image_url TEXT        NOT NULL DEFAULT '',            -- Future: Supabase Storage URL
  after_image_url  TEXT        NOT NULL DEFAULT '',            -- DALL-E 3 generated URL
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_athena_analyses_project_id
  ON athena_analyses(project_id);

CREATE INDEX IF NOT EXISTS idx_athena_projects_created_at
  ON athena_projects(created_at DESC);

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- Enable RLS on both tables (required for Supabase security model).
-- Grants below allow the service_role, authenticated users, and anon to
-- read/write. Tighten these policies when you add real authentication.

ALTER TABLE athena_projects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE athena_analyses  ENABLE ROW LEVEL SECURITY;

-- Allow full access for all roles (update these policies when adding real auth)
CREATE POLICY "Allow all for service_role on projects"
  ON athena_projects FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for authenticated on projects"
  ON athena_projects FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for anon on projects"
  ON athena_projects FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for service_role on analyses"
  ON athena_analyses FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for authenticated on analyses"
  ON athena_analyses FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for anon on analyses"
  ON athena_analyses FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ─── Grants ───────────────────────────────────────────────────────────────────

GRANT ALL ON athena_projects TO service_role, authenticated, anon;
GRANT ALL ON athena_analyses TO service_role, authenticated, anon;
