CREATE TABLE IF NOT EXISTS query_logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  model_used TEXT,
  model_tier TEXT,
  hallucination_score FLOAT,
  cost_saved_percentage INT,
  cache_hit BOOLEAN DEFAULT FALSE,
  routing_reason TEXT,
  response_time_ms INT,
  was_escalated BOOLEAN DEFAULT FALSE,
  confidence_score FLOAT,
  context_completeness_score FLOAT,
  trust_score INT
);
