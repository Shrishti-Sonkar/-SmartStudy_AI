import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface QueryLog {
  id: string;
  question: string;
  answer: string;
  model_used: string;
  model_tier: string;
  hallucination_score: number;
  cost_saved_percentage: number;
  cache_hit: boolean;
  routing_reason: string | null;
  response_time_ms: number | null;
  was_escalated: boolean;
  created_at: string;
  trust_score: number | null;
  risk_level: string | null;
  confidence_score: number | null;
  context_completeness_score: number | null;
}

export function useQueryHistory(limit = 20) {
  return useQuery({
    queryKey: ['query-history', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('query_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as QueryLog[];
    },
    refetchInterval: 5000
  });
}
