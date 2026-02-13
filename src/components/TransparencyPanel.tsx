import { useState } from 'react';
import { ChevronDown, ChevronUp, Info, Zap, Brain, Sparkles, TrendingDown, Shield, Activity, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AskResponse } from '@/hooks/useAsk';

interface TransparencyPanelProps {
  response: AskResponse;
}

export function TransparencyPanel({ response }: TransparencyPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getModelExplanation = () => {
    switch (response.model_tier) {
      case 'LLM-1':
        return {
          icon: Zap,
          title: 'Fast Recall Model (Gemini Flash Lite)',
          description: 'Your question was identified as a simple factual query. We used our fastest, most efficient model to provide a quick and accurate answer.',
          efficiency: 'This saves ~80% computation compared to using the most powerful model.'
        };
      case 'LLM-2':
        return {
          icon: Brain,
          title: 'Concept Understanding Model (Groq Llama 3.1)',
          description: 'Your question requires explanation and examples. We used a balanced model that excels at teaching concepts clearly.',
          efficiency: 'This saves ~40% computation compared to using the most powerful model.'
        };
      case 'LLM-3':
        return {
          icon: Sparkles,
          title: 'Deep Reasoning Model (Gemini Pro)',
          description: 'Your question involves complex reasoning or multi-step problem solving. We used our most capable model for thorough analysis.',
          efficiency: 'This model provides maximum accuracy for difficult questions.'
        };
      default:
        return {
          icon: Info,
          title: 'Unknown Model',
          description: 'Model information unavailable.',
          efficiency: ''
        };
    }
  };

  const getRiskExplanation = () => {
    switch (response.risk_level) {
      case 'low':
        return 'This response has high confidence and comprehensive coverage of your question.';
      case 'medium':
        return 'This response may have some uncertainty. Review for accuracy if used for important decisions.';
      case 'high':
        return 'This response has significant uncertainty. Consider verifying with additional sources or using human override.';
      default:
        return '';
    }
  };

  const modelInfo = getModelExplanation();
  const ModelIcon = modelInfo.icon;

  return (
    <div className="mt-4 rounded-lg border border-border bg-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Info size={16} />
          <span>Trust Score Breakdown & AI Transparency</span>
        </div>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
          {/* Trust Score Breakdown */}
          <div className="p-4 rounded-lg bg-muted/30 space-y-3">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Shield size={16} className="text-primary" />
              Human-AI Co-Worker Trust Score Engine
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="p-2 rounded bg-background/50">
                <p className="text-muted-foreground">Trust Score</p>
                <p className="font-bold text-lg">{response.trust_score}/100</p>
              </div>
              <div className="p-2 rounded bg-background/50">
                <p className="text-muted-foreground flex items-center gap-1">
                  <Activity size={12} /> Confidence
                </p>
                <p className="font-medium">{Math.round(response.confidence_score * 100)}%</p>
              </div>
              <div className="p-2 rounded bg-background/50">
                <p className="text-muted-foreground flex items-center gap-1">
                  <FileCheck size={12} /> Coverage
                </p>
                <p className="font-medium">{Math.round(response.context_completeness_score * 100)}%</p>
              </div>
              <div className="p-2 rounded bg-background/50">
                <p className="text-muted-foreground">Hallucination</p>
                <p className="font-medium">{Math.round(response.hallucination_score * 100)}%</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Formula: Trust = (Confidence × 0.3) + ((1 − Hallucination) × 0.4) + (Coverage × 0.3)
            </p>
            <p className="text-sm text-muted-foreground">{getRiskExplanation()}</p>
          </div>

          {/* Model Selection Explanation */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
              <ModelIcon size={20} className="text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">{modelInfo.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{modelInfo.description}</p>
            </div>
          </div>
          
          {/* Efficiency Stats */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 p-2 rounded-lg bg-accent/10">
              <TrendingDown size={20} className="text-accent" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">Computation Saved: {response.cost_saved}</h4>
              <p className="text-sm text-muted-foreground mt-1">{modelInfo.efficiency}</p>
            </div>
          </div>
          
          {/* Routing Reason */}
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Routing decision:</span> {response.routing_reason}
            </p>
          </div>
          
          {/* Response Time */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Response time:</span>
            <span className="font-mono font-medium text-foreground">{response.response_time_ms}ms</span>
          </div>
          
          {response.was_escalated && (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
              <p className="text-sm text-warning-foreground">
                <span className="font-medium">⚠️ Auto-escalation:</span> Initial response had high uncertainty, so we verified with a more capable model.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
