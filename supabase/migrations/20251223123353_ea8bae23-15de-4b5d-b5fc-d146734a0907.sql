-- Create table for caching questions and answers (semantic cache)
CREATE TABLE public.questions_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  question_embedding TEXT, -- Store as JSON string for similarity matching
  answer TEXT NOT NULL,
  model_used TEXT NOT NULL,
  model_tier TEXT NOT NULL,
  hallucination_score DECIMAL(3,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster text search on questions
CREATE INDEX idx_questions_cache_question ON public.questions_cache USING gin(to_tsvector('english', question));

-- Create table for query logs and analytics
CREATE TABLE public.query_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  model_used TEXT NOT NULL,
  model_tier TEXT NOT NULL,
  hallucination_score DECIMAL(3,2) NOT NULL DEFAULT 0,
  cost_saved_percentage INTEGER NOT NULL DEFAULT 0,
  cache_hit BOOLEAN NOT NULL DEFAULT false,
  routing_reason TEXT,
  response_time_ms INTEGER,
  was_escalated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for date-based queries
CREATE INDEX idx_query_logs_created_at ON public.query_logs(created_at DESC);

-- Create table for aggregated analytics
CREATE TABLE public.analytics_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_queries INTEGER NOT NULL DEFAULT 0,
  cache_hits INTEGER NOT NULL DEFAULT 0,
  avg_hallucination_score DECIMAL(3,2) NOT NULL DEFAULT 0,
  llm1_usage INTEGER NOT NULL DEFAULT 0,
  llm2_usage INTEGER NOT NULL DEFAULT 0,
  llm3_usage INTEGER NOT NULL DEFAULT 0,
  escalations INTEGER NOT NULL DEFAULT 0,
  total_cost_saved_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables (but allow public access for demo purposes)
ALTER TABLE public.questions_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_summary ENABLE ROW LEVEL SECURITY;

-- Create public read/write policies for demo (no auth required)
CREATE POLICY "Allow public read access to cache" ON public.questions_cache FOR SELECT USING (true);
CREATE POLICY "Allow public insert to cache" ON public.questions_cache FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to logs" ON public.query_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert to logs" ON public.query_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to analytics" ON public.analytics_summary FOR SELECT USING (true);
CREATE POLICY "Allow public insert to analytics" ON public.analytics_summary FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to analytics" ON public.analytics_summary FOR UPDATE USING (true);

-- Create function to update analytics summary
CREATE OR REPLACE FUNCTION public.update_analytics_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.analytics_summary (date, total_queries, cache_hits, avg_hallucination_score, llm1_usage, llm2_usage, llm3_usage, escalations, total_cost_saved_percentage)
  VALUES (
    CURRENT_DATE,
    1,
    CASE WHEN NEW.cache_hit THEN 1 ELSE 0 END,
    NEW.hallucination_score,
    CASE WHEN NEW.model_tier = 'LLM-1' THEN 1 ELSE 0 END,
    CASE WHEN NEW.model_tier = 'LLM-2' THEN 1 ELSE 0 END,
    CASE WHEN NEW.model_tier = 'LLM-3' THEN 1 ELSE 0 END,
    CASE WHEN NEW.was_escalated THEN 1 ELSE 0 END,
    NEW.cost_saved_percentage
  )
  ON CONFLICT (date) DO UPDATE SET
    total_queries = analytics_summary.total_queries + 1,
    cache_hits = analytics_summary.cache_hits + CASE WHEN NEW.cache_hit THEN 1 ELSE 0 END,
    avg_hallucination_score = (analytics_summary.avg_hallucination_score * analytics_summary.total_queries + NEW.hallucination_score) / (analytics_summary.total_queries + 1),
    llm1_usage = analytics_summary.llm1_usage + CASE WHEN NEW.model_tier = 'LLM-1' THEN 1 ELSE 0 END,
    llm2_usage = analytics_summary.llm2_usage + CASE WHEN NEW.model_tier = 'LLM-2' THEN 1 ELSE 0 END,
    llm3_usage = analytics_summary.llm3_usage + CASE WHEN NEW.model_tier = 'LLM-3' THEN 1 ELSE 0 END,
    escalations = analytics_summary.escalations + CASE WHEN NEW.was_escalated THEN 1 ELSE 0 END,
    total_cost_saved_percentage = (analytics_summary.total_cost_saved_percentage * analytics_summary.total_queries + NEW.cost_saved_percentage) / (analytics_summary.total_queries + 1),
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-update analytics
CREATE TRIGGER trigger_update_analytics
AFTER INSERT ON public.query_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_analytics_summary();