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

  const askQuestion = async (question: string, forcedModelTier?: string): Promise<AskResponse | null> => {
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
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get answer';
      setError(message);
      return null;
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
