import { cn } from '@/lib/utils';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

export type RiskLevel = 'low' | 'medium' | 'high';

interface RiskBadgeProps {
  level: RiskLevel;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

const riskConfig = {
  high: {
    label: 'High Risk',
    icon: AlertTriangle,
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    emoji: '🔴'
  },
  medium: {
    label: 'Medium Risk',
    icon: AlertCircle,
    className: 'bg-warning/10 text-warning border-warning/20',
    emoji: '🟡'
  },
  low: {
    label: 'Low Risk',
    icon: CheckCircle,
    className: 'bg-success/10 text-success border-success/20',
    emoji: '🟢'
  }
};

export function RiskBadge({ level, showIcon = true, size = 'md' }: RiskBadgeProps) {
  const config = riskConfig[level];
  const Icon = config.icon;

  return (
    <div className={cn(
      "inline-flex items-center rounded-full border font-medium gap-1.5",
      config.className,
      size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
    )}>
      {showIcon && (
        <span className="text-sm">{config.emoji}</span>
      )}
      <span>{config.label}</span>
    </div>
  );
}
