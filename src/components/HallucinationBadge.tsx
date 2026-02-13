import { cn } from '@/lib/utils';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

interface HallucinationBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function HallucinationBadge({ score, size = 'md', showLabel = true }: HallucinationBadgeProps) {
  const getConfig = (score: number) => {
    if (score < 0.3) {
      return {
        label: 'High Confidence',
        color: 'bg-success/10 text-success border-success/20',
        Icon: ShieldCheck,
        description: 'Answer is highly reliable'
      };
    } else if (score < 0.6) {
      return {
        label: 'Moderate Confidence',
        color: 'bg-warning/10 text-warning-foreground border-warning/20',
        Icon: Shield,
        description: 'Review recommended'
      };
    } else {
      return {
        label: 'Low Confidence',
        color: 'bg-destructive/10 text-destructive border-destructive/20',
        Icon: ShieldAlert,
        description: 'Verified by additional model'
      };
    }
  };

  const config = getConfig(score);
  const Icon = config.Icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
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
      {showLabel && (
        <span>{config.label}</span>
      )}
      <span className="font-mono">({(score * 100).toFixed(0)}%)</span>
    </div>
  );
}
