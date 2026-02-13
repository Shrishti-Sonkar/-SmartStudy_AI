import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsSummary {
  id: string;
  date: string;
  total_queries: number;
  cache_hits: number;
  avg_hallucination_score: number;
  llm1_usage: number;
  llm2_usage: number;
  llm3_usage: number;
  escalations: number;
  total_cost_saved_percentage: number;
}

export interface AggregatedStats {
  totalQueries: number;
  totalCacheHits: number;
  avgHallucinationScore: number;
  avgCostSaved: number;
  modelDistribution: {
    llm1: number;
    llm2: number;
    llm3: number;
  };
  cacheHitRate: number;
  escalationRate: number;
}

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_summary')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      return data as AnalyticsSummary[];
    },
    refetchInterval: 10000
  });
}

export function useAggregatedStats() {
  const { data: analytics, isLoading, error } = useAnalytics();
  
  const stats: AggregatedStats | null = analytics && analytics.length > 0
    ? {
        totalQueries: analytics.reduce((sum, a) => sum + a.total_queries, 0),
        totalCacheHits: analytics.reduce((sum, a) => sum + a.cache_hits, 0),
        avgHallucinationScore: analytics.reduce((sum, a) => sum + Number(a.avg_hallucination_score), 0) / analytics.length,
        avgCostSaved: analytics.reduce((sum, a) => sum + Number(a.total_cost_saved_percentage), 0) / analytics.length,
        modelDistribution: {
          llm1: analytics.reduce((sum, a) => sum + a.llm1_usage, 0),
          llm2: analytics.reduce((sum, a) => sum + a.llm2_usage, 0),
          llm3: analytics.reduce((sum, a) => sum + a.llm3_usage, 0),
        },
        cacheHitRate: analytics.reduce((sum, a) => sum + a.cache_hits, 0) / 
                      Math.max(analytics.reduce((sum, a) => sum + a.total_queries, 0), 1) * 100,
        escalationRate: analytics.reduce((sum, a) => sum + a.escalations, 0) /
                       Math.max(analytics.reduce((sum, a) => sum + a.total_queries, 0), 1) * 100
      }
    : null;
  
  return { stats, isLoading, error };
}
