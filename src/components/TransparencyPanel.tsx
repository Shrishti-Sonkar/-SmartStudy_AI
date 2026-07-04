import { useState } from 'react';
import { ChevronDown, ChevronUp, Info, Zap, Brain, Sparkles, TrendingDown, Shield, Activity, FileCheck, Search, Image, BarChart2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AskResponse } from '@/hooks/useAsk';

interface TransparencyPanelProps {
  response: AskResponse;
}

export function TransparencyPanel({ response }: TransparencyPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showScores, setShowScores] = useState(false);

  const getModelExplanation = () => {
    const tier = response.model_tier;

    // ── Feature 1: Research Tier ─────────────────────────────────────────────
    if (tier.includes('Research')) {
      return {
        icon: Search,
        title: 'Research Mode — Mid-Tier Model',
        description: 'Your query contained research-intent keywords. We used a mid-tier model with a source-citation prompt to provide a referenced, academic-quality answer.',
        efficiency: 'Research mode uses a cost-efficient mid-tier model (same savings as Tier 2).'
      };
    }

    // ── Feature 2: Vision Tier ───────────────────────────────────────────────
    if (tier.includes('Vision')) {
      const hasRealImage = !!response.image_url;
      const providerLabel = response.image_provider ?? 'OpenRouter (Nano Banana)';
      return {
        icon: Image,
        title: hasRealImage
          ? `Vision Mode — ${providerLabel} Image Generation`
          : 'Vision Mode — Text Description (MVP Fallback)',
        description: hasRealImage
          ? `Your query was detected as an image-generation request. We called the ${providerLabel} API (globally available) and generated a real image. The result is attributed to ${providerLabel}.`
          : 'Your query was detected as an image-generation request. Image generation was unavailable so a detailed text description was generated as a fallback (Vision Mode MVP).',
        efficiency: 'Estimated Vision compute cost shown vs. a premium image-generation baseline.'
      };
    }

    // ── Existing tiers ───────────────────────────────────────────────────────
    if (tier.includes('Tier 1') || tier.includes('Fast Recall') || tier.includes('Escalated')) {
      return {
        icon: Zap,
        title: tier.includes('Escalated') ? 'Auto-Escalated: Fast Recall → Tier 2' : 'Fast Recall Model',
        description: tier.includes('Escalated')
          ? 'The Tier-1 response had low heuristic confidence. The system transparently escalated to Tier-2 for a more reliable answer.'
          : 'Your question was identified as a simple factual query. We used our fastest, most efficient model.',
        efficiency: 'This saves ~80% computation compared to using the most powerful model.'
      };
    }

    if (tier.includes('Tier 2') || tier.includes('Explanation')) {
      return {
        icon: Brain,
        title: 'Concept Understanding Model',
        description: 'Your question requires explanation and examples. We used a balanced model that excels at teaching concepts clearly.',
        efficiency: 'This saves ~40% computation compared to using the most powerful model.'
      };
    }

    if (tier.includes('Tier 3') || tier.includes('Deep Reasoning')) {
      return {
        icon: Sparkles,
        title: 'Deep Reasoning Model',
        description: 'Your question involves complex reasoning or multi-step problem solving. We used our most capable model for thorough analysis.',
        efficiency: 'This model provides maximum accuracy for difficult questions.'
      };
    }

    return {
      icon: Brain,
      title: 'AI Model',
      description: 'Answered using an intelligent AI model.',
      efficiency: 'Optimized for your query type.'
    };
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

  // ── Mode pill helper ─────────────────────────────────────────────────────
  const modeLabel = response.mode === 'research'
    ? { label: '🔍 Research Mode', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300' }
    : response.mode === 'vision'
      ? { label: '🎨 Vision Mode', color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300' }
      : null;

  // ── Routing scores table ─────────────────────────────────────────────────
  const routingScores = response.routing_scores;
  const tierLabels: Record<string, string> = {
    recall: 'Fast Recall (Tier 1)',
    explanation: 'Explanation (Tier 2)',
    deep_reasoning: 'Deep Reasoning (Tier 3)',
    research: 'Research Mode',
    vision: 'Vision Mode',
  };

  return (
    <div className="mt-4 rounded-lg border border-border bg-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Info size={16} />
          <span>Trust Score Breakdown & AI Transparency</span>
          {/* Mode pill visible even when panel is collapsed */}
          {modeLabel && (
            <span className={cn('ml-2 px-2 py-0.5 text-xs rounded-full border font-semibold', modeLabel.color)}>
              {modeLabel.label}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">

          {/* ── Feature 1 & 2: Mode + Sources Banner ─────────────────────── */}
          {response.mode && response.mode !== 'text' && (
            <div className={cn(
              'flex flex-wrap items-center gap-3 p-3 rounded-lg text-sm border',
              response.mode === 'research'
                ? 'bg-blue-50/70 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800'
                : 'bg-purple-50/70 border-purple-200 dark:bg-purple-900/10 dark:border-purple-800'
            )}>
              {response.mode === 'research' ? (
                <Search size={15} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
              ) : (
                <Image size={15} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
              )}
              <span className="font-semibold">
                {response.mode === 'research' ? 'Research Mode Active' : (
                  response.image_url
                    ? `Vision Mode Active — ${response.image_provider ?? 'OpenRouter (Nano Banana)'}`
                    : 'Vision Mode Active (MVP Fallback)'
                )}
              </span>
              {/* 🎨 Provider attribution badge */}
              {response.mode === 'vision' && response.image_url && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-200 text-purple-800 dark:bg-purple-800/40 dark:text-purple-200 border border-purple-300 dark:border-purple-700">
                  🎨 Image generated by {response.image_provider ?? 'OpenRouter (Nano Banana)'}
                </span>
              )}
              {response.mode === 'research' && (
                <>
                  <span className="text-muted-foreground">Sources Used:</span>
                  <span className={cn('font-medium', response.sources_used ? 'text-emerald-600' : 'text-red-500')}>
                    {response.sources_used ? 'Yes ✓' : 'No'}
                  </span>
                  <span className="text-muted-foreground">Cache:</span>
                  <span className={cn('font-medium', response.cache_hit ? 'text-emerald-600' : 'text-amber-500')}>
                    {response.cache_hit ? 'Hit ✓' : 'Miss'}
                  </span>
                </>
              )}
              {response.mode === 'vision' && response.image_size && (
                <>
                  <span className="text-muted-foreground">Image Size:</span>
                  <span className="font-medium">{response.image_size}</span>
                  <span className="text-muted-foreground">Cache:</span>
                  <span className={cn('font-medium', response.cache_hit ? 'text-emerald-600' : 'text-amber-500')}>
                    {response.cache_hit ? 'Hit ✓' : 'Miss'}
                  </span>
                </>
              )}
            </div>
          )}

          {/* ── Trust Score Breakdown (UNCHANGED) ───────────────────────── */}
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
                <p className="font-medium">{Math.round(response.context_completeness_score)}%</p>
              </div>
              <div className="p-2 rounded bg-background/50">
                <p className="text-muted-foreground">Hallucination</p>
                <p className="font-medium">{Math.round(response.hallucination_score)}%</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Formula: Trust = (Confidence × 0.3) + ((1 − Hallucination) × 0.4) + (Coverage × 0.3)
            </p>
            <p className="text-sm text-muted-foreground">{getRiskExplanation()}</p>
          </div>

          {/* ── Model Selection Explanation (UNCHANGED) ──────────────────── */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
              <ModelIcon size={20} className="text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">{modelInfo.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{modelInfo.description}</p>
            </div>
          </div>

          {/* ── Efficiency Stats (UNCHANGED) ─────────────────────────────── */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 p-2 rounded-lg bg-accent/10">
              <TrendingDown size={20} className="text-accent" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">Computation Saved: {response.cost_saved}</h4>
              <p className="text-sm text-muted-foreground mt-1">{modelInfo.efficiency}</p>
            </div>
          </div>

          {/* ── Routing Reason (UNCHANGED) ───────────────────────────────── */}
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Routing decision:</span> {response.routing_reason}
            </p>
          </div>

          {/* ── Feature 3: Routing Score Breakdown ──────────────────────── */}
          {routingScores && (
            <div className="rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setShowScores(!showScores)}
                className="flex w-full items-center justify-between px-3 py-2 text-sm bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <BarChart2 size={14} className="text-primary" />
                  Routing Score Breakdown
                </span>
                {showScores ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showScores && (
                <div className="px-3 pb-3 pt-2 space-y-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    {response.routing_score_reason}
                  </p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-muted-foreground border-b border-border">
                        <th className="text-left py-1 font-medium">Tier</th>
                        <th className="text-right py-1 font-medium">Score</th>
                        <th className="text-right py-1 font-medium w-24"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(routingScores)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .map(([tier, score]) => {
                          const maxScore = Math.max(...Object.values(routingScores).map(Number), 1);
                          const pct = Math.round((Number(score) / maxScore) * 100);
                          const isWinner = tier === (response.mode === 'research' ? 'research' : response.mode === 'vision' ? 'vision' : response.model_tier.toLowerCase().includes('recall') ? 'recall' : response.model_tier.toLowerCase().includes('deep') ? 'deep_reasoning' : 'explanation');
                          return (
                            <tr key={tier} className={cn('border-b border-border/50 last:border-0', isWinner && 'font-semibold')}>
                              <td className="py-1.5 text-foreground flex items-center gap-1">
                                {isWinner && <span className="text-primary text-xs">▶</span>}
                                {tierLabels[tier] || tier}
                              </td>
                              <td className="py-1.5 text-right font-mono tabular-nums">{score}</td>
                              <td className="py-1.5 pl-3">
                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={cn('h-full rounded-full', isWinner ? 'bg-primary' : 'bg-muted-foreground/30')}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Response Time (UNCHANGED) ─────────────────────────────────── */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Response time:</span>
            <span className="font-mono font-medium text-foreground">{response.response_time_ms}ms</span>
          </div>

          {/* ── Feature 4: Escalation (Extended from existing) ───────────── */}
          {response.was_escalated && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/10 dark:border-amber-800 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Auto-Escalation Triggered
                </p>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                {response.escalation_reason ||
                  'Initial response had high uncertainty, so we verified with a more capable model.'}
              </p>
            </div>
          )}

          {/* ── Structured Reference Metadata (UNCHANGED) ────────────────── */}
          {response.reference_metadata && (
            <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-100 dark:bg-blue-900/10 dark:border-blue-800 space-y-3">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <FileCheck size={16} className="text-blue-600 dark:text-blue-400" />
                Structured References & Metadata
              </h4>

              <div className="grid gap-3 text-sm">
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="text-muted-foreground font-medium">Reliability Status:</span>
                  <span className="font-medium text-foreground">{response.reference_metadata.reliability_status}</span>
                </div>

                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="text-muted-foreground font-medium">Curriculum:</span>
                  <span className="text-foreground">{response.reference_metadata.curriculum_coverage}</span>
                </div>

                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="text-muted-foreground font-medium">Suggested Ref:</span>
                  <span className="text-foreground italic">{response.reference_metadata.suggested_reference}</span>
                </div>

                <div>
                  <span className="text-muted-foreground font-medium block mb-1">Key Concepts:</span>
                  <div className="flex flex-wrap gap-2">
                    {response.reference_metadata.key_concepts.map((concept, idx) => (
                      <span key={idx} className="px-2 py-1 rounded bg-background border border-border text-xs">
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
