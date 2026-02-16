-- Enable RLS (Row Level Security) if not already enabled
-- alter table query_logs enable row level security;

-- 1. Table: user_progress
-- Tracks every interaction (question attempt) and its result
CREATE TABLE IF NOT EXISTS user_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id), -- Optional if you have auth, else can be nullable or session_id
  topic_path TEXT NOT NULL, -- e.g., "Physics > Kinematics > Vectors"
  question_id TEXT, -- ID of the generated question (if available)
  is_correct BOOLEAN, -- For tricky/benchmark questions
  confidence_score FLOAT, -- Self-reported or AI-estimated (0.0 - 1.0)
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table: concept_mastery
-- Aggregated view of a student's standing in each topic
CREATE TABLE IF NOT EXISTS concept_mastery (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  topic_path TEXT NOT NULL,
  mastery_score FLOAT DEFAULT 0.0, -- 0 to 100
  attempts_count INT DEFAULT 0,
  last_practiced TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic_path)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_progress_topic ON user_progress(topic_path);
CREATE INDEX IF NOT EXISTS idx_concept_mastery_user ON concept_mastery(user_id);
