import { cn } from '@/lib/utils';
import { Zap, Brain, Sparkles } from 'lucide-react';

interface ModelBadgeProps {
  tier: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ModelBadge({ tier, name, size = 'md' }: ModelBadgeProps) {
  const getConfig = (tier: string) => {
    switch (tier) {
      case 'LLM-1':
        return {
          color: 'bg-llm1/10 text-llm1 border-llm1/20',
          Icon: Zap,
          label: 'Fast Recall'
        };
      case 'LLM-2':
        return {
          color: 'bg-llm2/10 text-llm2 border-llm2/20',
          Icon: Brain,
          label: 'Concept Understanding'
        };
      case 'LLM-3':
        return {
          color: 'bg-llm3/10 text-llm3 border-llm3/20',
          Icon: Sparkles,
          label: 'Deep Reasoning'
        };
      default:
        return {
          color: 'bg-muted text-muted-foreground border-border',
          Icon: Brain,
          label: 'Unknown'
        };
    }
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
