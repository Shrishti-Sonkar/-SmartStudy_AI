-- Create human_feedback table for Human-in-the-Loop controls
CREATE TABLE public.human_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  trust_score NUMERIC NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL,
  decision TEXT NOT NULL,
  query_log_id UUID REFERENCES public.query_logs(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.human_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since there's no auth)
CREATE POLICY "Allow public insert to feedback" 
ON public.human_feedback 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public read access to feedback" 
ON public.human_feedback 
FOR SELECT 
USING (true);

-- Add trust_score and risk_level columns to query_logs
ALTER TABLE public.query_logs 
ADD COLUMN trust_score NUMERIC DEFAULT 0,
ADD COLUMN risk_level TEXT DEFAULT 'medium',
ADD COLUMN confidence_score NUMERIC DEFAULT 0,
ADD COLUMN context_completeness_score NUMERIC DEFAULT 0;

-- Add override_count to questions_cache for learning loop
ALTER TABLE public.questions_cache
ADD COLUMN override_count INTEGER DEFAULT 0,
ADD COLUMN trust_penalty NUMERIC DEFAULT 0;