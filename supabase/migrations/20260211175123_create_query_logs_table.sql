-- Create the table
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

-- Enable RLS (Security)
ALTER TABLE query_logs ENABLE ROW LEVEL SECURITY;

-- Allow ANYONE (including public/anon users) to read/view query history
CREATE POLICY "Public Read Access" 
ON query_logs 
FOR SELECT 
USING (true);

-- Allow ANYONE (including public/anon users) to insert new logs (needed for frontend-direct calls)
CREATE POLICY "Public Insert Access" 
ON query_logs 
FOR INSERT 
WITH CHECK (true);

-- Allow authenticated users (service role, etc) full access
CREATE POLICY "Service Role Full Access" 
ON query_logs 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
