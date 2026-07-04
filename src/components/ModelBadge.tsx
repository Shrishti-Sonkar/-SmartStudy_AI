import { cn } from '@/lib/utils';
import { Zap, Brain, Sparkles } from 'lucide-react';

interface ModelBadgeProps {
  tier: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ModelBadge({ tier, name, size = 'md' }: ModelBadgeProps) {
  const getConfig = (tier: string) => {
    // Handle both old "LLM-1" and new "Fast Recall (Tier 1)" formats
    const isTier1 = tier === 'LLM-1' || tier.includes('Tier 1');
    const isTier2 = tier === 'LLM-2' || tier.includes('Tier 2');
    const isTier3 = tier === 'LLM-3' || tier.includes('Tier 3');

    if (isTier1) {
      return {
        color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        Icon: Zap,
        label: 'T5'
      };
    }

    if (isTier2) {
      return {
        color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
        Icon: Brain,
        label: 'Mistral' // User requested rename
      };
    }

    if (isTier3) {
      return {
        color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        Icon: Sparkles,
        label: 'Llama'
      };
    }

    return {
      color: 'bg-muted text-muted-foreground border-border',
      Icon: Brain,
      label: name || 'Unknown' // Fallback to raw name if known
    };
  };

  const config = getConfig(tier);
  const Icon = config.Icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1.5 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2'
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  };

  return (
    <div className={cn(
      'inline-flex items-center rounded-full border font-medium',
      config.color,
      sizeClasses[size]
    )}>
      <Icon size={iconSizes[size]} />
      <span>{config.label}</span>
    </div>
  );
}
