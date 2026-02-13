import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HumanFeedbackEntry {
  id: string;
  question: string;
  answer: string;
  trust_score: number;
  risk_level: string;
  decision: string;
  query_log_id: string | null;
  created_at: string;
}

export function useHumanFeedback(limit = 50) {
  return useQuery({
    queryKey: ['human-feedback', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('human_feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as HumanFeedbackEntry[];
    },
    refetchInterval: 10000,
  });
}
