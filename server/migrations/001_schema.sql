-- LepakMasjid PostgreSQL schema (migrated from PocketBase)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE mosque_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE activity_type AS ENUM ('one_off', 'recurring', 'fixed');
CREATE TYPE activity_status AS ENUM ('active', 'cancelled');
CREATE TYPE submission_type AS ENUM ('new_mosque', 'edit_mosque');
CREATE TYPE submission_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  name TEXT,
  avatar_path TEXT,
  role user_role NOT NULL DEFAULT 'user',
  verified BOOLEAN NOT NULL DEFAULT false,
  google_sub TEXT UNIQUE,
  created TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE mosques (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_bm TEXT,
  address TEXT NOT NULL,
  contact TEXT,
  state TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  description TEXT,
  description_bm TEXT,
  image_path TEXT,
  status mosque_status NOT NULL DEFAULT 'pending',
  created_by TEXT NOT NULL REFERENCES users(id),
  created TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mosques_status ON mosques (status);
CREATE INDEX idx_mosques_state ON mosques (state);
CREATE INDEX idx_mosques_location ON mosques (lat, lng);

CREATE TABLE amenities (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  label_bm TEXT NOT NULL,
  label_en TEXT NOT NULL,
  icon TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE mosque_amenities (
  id TEXT PRIMARY KEY,
  mosque_id TEXT NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  amenity_id TEXT REFERENCES amenities(id) ON DELETE SET NULL,
  details JSONB NOT NULL DEFAULT '{}',
  verified BOOLEAN NOT NULL DEFAULT false,
  created TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mosque_amenities_mosque ON mosque_amenities (mosque_id);
CREATE INDEX idx_mosque_amenities_amenity ON mosque_amenities (amenity_id);

CREATE TABLE activities (
  id TEXT PRIMARY KEY,
  mosque_id TEXT NOT NULL REFERENCES mosques(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_bm TEXT,
  description TEXT,
  description_bm TEXT,
  type activity_type NOT NULL,
  schedule_json JSONB NOT NULL,
  start_date DATE,
  end_date DATE,
  status activity_status NOT NULL DEFAULT 'active',
  created_by TEXT NOT NULL REFERENCES users(id),
  created TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_mosque ON activities (mosque_id);
CREATE INDEX idx_activities_status ON activities (status);

CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  type submission_type NOT NULL,
  mosque_id TEXT REFERENCES mosques(id) ON DELETE SET NULL,
  data JSONB NOT NULL,
  status submission_status NOT NULL DEFAULT 'pending',
  submitted_by TEXT NOT NULL REFERENCES users(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  image_path TEXT,
  created TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_submissions_status ON submissions (status);
CREATE INDEX idx_submissions_submitted_by ON submissions (submitted_by);
CREATE INDEX idx_submissions_submitted_at ON submissions (submitted_at);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  before JSONB,
  after JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  created TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs (actor_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs (timestamp);