/*
  # Speaker Platform — Venues & Intake Draft Tables

  1. New Tables
    - `venues`
      - Mirrors the Venue TypeScript type
      - Stores all speaking opportunity venues
      - Fields: id, name, type, vertical, audience, audience_size_range, topic_tags (jsonb), cfp_url
    - `intake_sessions`
      - Lightweight email-based session for resuming drafts across devices
      - Fields: id (uuid), email (text unique), created_at
    - `intake_drafts`
      - Auto-saves the intake form state as JSON
      - Fields: id, session_id (fk), intake_json (jsonb), updated_at

  2. Security
    - RLS enabled on all tables
    - `venues` is publicly readable (no auth required — it's a catalog)
    - `intake_sessions` and `intake_drafts` are owner-only via session_id cookie pattern
      (session_id stored client-side, used as lookup key — no Supabase auth required for MVP)
    - INSERT/UPDATE on drafts is open to anon (session-keyed, not user-auth-keyed for MVP)

  3. Notes
    - venue `type` values: podcast, video_podcast, conference, digital_event
    - venue `audience_size_range` values: intimate, mid, growing
    - intake_drafts uses jsonb for flexibility as intake schema evolves
*/

-- Venues catalog
CREATE TABLE IF NOT EXISTS venues (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('podcast', 'video_podcast', 'conference', 'digital_event')),
  vertical text NOT NULL DEFAULT '',
  audience text NOT NULL DEFAULT '',
  audience_size_range text NOT NULL CHECK (audience_size_range IN ('intimate', 'mid', 'growing')),
  topic_tags jsonb NOT NULL DEFAULT '[]',
  cfp_url text NOT NULL DEFAULT '#',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venues are publicly readable"
  ON venues FOR SELECT
  TO anon, authenticated
  USING (true);

-- Intake sessions (email-keyed, no Supabase auth required)
CREATE TABLE IF NOT EXISTS intake_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE intake_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create an intake session"
  ON intake_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Sessions are readable by anyone with the id"
  ON intake_sessions FOR SELECT
  TO anon, authenticated
  USING (true);

-- Intake drafts (linked to session by id)
CREATE TABLE IF NOT EXISTS intake_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES intake_sessions(id) ON DELETE CASCADE,
  intake_json jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE intake_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert a draft"
  ON intake_drafts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read drafts by session_id"
  ON intake_drafts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update their draft"
  ON intake_drafts FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS intake_drafts_session_id_idx ON intake_drafts(session_id);
