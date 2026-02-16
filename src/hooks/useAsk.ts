import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface AskResponse {
  answer: string;
  hallucination_score: number;
  model_used: string;
  model_tier: string;
  cost_saved: string;
  cache_hit: boolean;
  routing_reason: string;
  response_time_ms: number;
  was_escalated?: boolean;
  // Trust Score Engine fields
  trust_score: number;
  risk_level: RiskLevel;
  confidence_score: number;
  context_completeness_score: number;
  covered_topics?: string[];
  reliability_status?: string;
  learning_recommendations?: string[];
  learning_level?: string;
}

export interface QueryHistoryItem {
  id: string;
  question: string;
  answer: string;
  hallucination_score: number;
  model_tier: string;
  cache_hit: boolean;
  created_at: string;
}

export function useAsk() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AskResponse | null>(null);

  const askQuestion = async (question: string, forcedModelTier?: string): Promise<{ data: AskResponse | null; error: string | null }> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('ask', {
        body: { question, forcedModelTier }
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResponse(data);
      return { data, error: null };
    } catch (err) {
      console.error('Error asking question:', err);
      let message = 'Failed to get answer';
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        message = String((err as any).message);
      } else if (typeof err === 'string') {
        message = err;
      }
      setError(message);
      return { data: null, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const clearResponse = () => {
    setResponse(null);
    setError(null);
  };

  return {
    askQuestion,
    isLoading,
    error,
    response,
    clearResponse
  };
}
