import { Copy, Check, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HallucinationBadge } from './HallucinationBadge';
import { ModelBadge } from './ModelBadge';
import { CacheBadge } from './CacheBadge';
import { TransparencyPanel } from './TransparencyPanel';
import { TrustScoreGauge } from './TrustScoreGauge';
import { RiskBadge } from './RiskBadge';
import { HumanFeedback } from './HumanFeedback';
import { AskResponse } from '@/hooks/useAsk';
import { cn } from '@/lib/utils';

interface AnswerDisplayProps {
  response: AskResponse;
  question: string;
  onNewQuestion: () => void;
}

export function AnswerDisplay({ response, question, onNewQuestion }: AnswerDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(response.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Question recap */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
        <p className="text-sm text-muted-foreground mb-1">Your question:</p>
        <p className="font-medium text-foreground">{question}</p>
      </div>

      {/* Trust Score Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-6">
          <TrustScoreGauge score={response.trust_score} size="md" />
          <div className="flex flex-col gap-2">
            <RiskBadge level={response.risk_level} />
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Confidence:</span> {Math.round(response.confidence_score * 100)}%
              <span className="mx-2">•</span>
              <span className="font-medium">Coverage:</span> {Math.round(response.context_completeness_score * 100)}%
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground text-center sm:text-right max-w-xs">
          <p className="font-medium text-foreground mb-1">Human-AI Co-Worker Trust Score</p>
          <p>This score quantifies the reliability of AI responses with human supervision.</p>
        </div>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap gap-2">
        <HallucinationBadge score={response.hallucination_score} />
        <ModelBadge tier={response.model_tier} name={response.model_used} />
        <CacheBadge cacheHit={response.cache_hit} />
        <div className="inline-flex items-center rounded-full border font-medium text-sm px-3 py-1 gap-1.5 bg-success/10 text-success border-success/20">
          💰 Saved {response.cost_saved}
        </div>
      </div>

      {/* Answer card */}
      <div className={cn(
        "relative p-6 rounded-2xl",
        "bg-card border-2 border-border",
        "shadow-soft"
      )}>
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-3"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-1 text-success" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>

        <div className="pr-24">
          <p className="text-sm text-muted-foreground mb-2">Answer:</p>
          <ScrollArea className="max-h-[500px] overflow-auto pr-4">
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
              {response.answer}
            </div>
          </ScrollArea>
        </div>

        {/* Model attribution */}
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Answered by <span className="font-medium text-foreground">{response.model_used}</span>
          </p>
          <p className="text-sm text-muted-foreground font-mono">
            {response.response_time_ms}ms
          </p>
        </div>
      </div>

      {/* Human-in-the-Loop Controls */}
      <HumanFeedback
        question={question}
        answer={response.answer}
        trustScore={response.trust_score}
        riskLevel={response.risk_level}
      />

      {/* Transparency panel */}
      <TransparencyPanel response={response} />

      {/* New question button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={onNewQuestion}
          variant="outline"
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Ask Another Question
        </Button>
      </div>
    </div>
  );
}
