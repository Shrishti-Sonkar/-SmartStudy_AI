import { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RiskLevel } from './RiskBadge';

interface HumanFeedbackProps {
  question: string;
  answer: string;
  trustScore: number;
  riskLevel: RiskLevel;
  queryLogId?: string;
  onFeedbackSubmitted?: (decision: 'approve' | 'override') => void;
}

export function HumanFeedback({ 
  question, 
  answer, 
  trustScore, 
  riskLevel,
  queryLogId,
  onFeedbackSubmitted 
}: HumanFeedbackProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<'approve' | 'override' | null>(null);
  const { toast } = useToast();

  const handleFeedback = async (decision: 'approve' | 'override') => {
    setIsSubmitting(true);
    
    try {
      // Store feedback in database
      const { error } = await supabase
        .from('human_feedback')
        .insert({
          question,
          answer,
          trust_score: trustScore,
          risk_level: riskLevel,
          decision,
          query_log_id: queryLogId || null
        });

      if (error) throw error;

      // If override, also update the cache to apply learning loop penalty
      if (decision === 'override') {
        // Find and update similar cached entries
        const { data: cacheEntries } = await supabase
          .from('questions_cache')
          .select('id, override_count, trust_penalty')
          .textSearch('question', question.split(' ').slice(0, 5).join(' | '), { type: 'websearch' })
          .limit(5);

        if (cacheEntries && cacheEntries.length > 0) {
          for (const entry of cacheEntries) {
            await supabase
              .from('questions_cache')
              .update({
                override_count: (entry.override_count || 0) + 1,
                trust_penalty: Math.min((entry.trust_penalty || 0) + 0.1, 0.5)
              })
              .eq('id', entry.id);
          }
        }
      }

      setSubmitted(decision);
      onFeedbackSubmitted?.(decision);
      
      toast({
        title: decision === 'approve' ? 'Response Approved' : 'Response Flagged',
        description: decision === 'approve' 
          ? 'Thank you for confirming this answer.'
          : 'This feedback will improve future responses.',
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
        {submitted === 'approve' ? (
          <Check className="h-5 w-5 text-success" />
        ) : (
          <X className="h-5 w-5 text-destructive" />
        )}
        <span className="text-sm text-muted-foreground">
          {submitted === 'approve' ? 'Response approved' : 'Response flagged for review'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border">
      <span className="text-sm text-muted-foreground">
        Was this answer helpful?
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFeedback('approve')}
          disabled={isSubmitting}
          className="gap-1.5 border-success/50 hover:bg-success/10 hover:border-success"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4 text-success" />
          )}
          Approve
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFeedback('override')}
          disabled={isSubmitting}
          className="gap-1.5 border-destructive/50 hover:bg-destructive/10 hover:border-destructive"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4 text-destructive" />
          )}
          Override
        </Button>
      </div>
    </div>
  );
}
