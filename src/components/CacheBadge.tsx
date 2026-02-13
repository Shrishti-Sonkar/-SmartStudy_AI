import { cn } from '@/lib/utils';
import { Database, Server } from 'lucide-react';

interface CacheBadgeProps {
  cacheHit: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CacheBadge({ cacheHit, size = 'md' }: CacheBadgeProps) {
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

  if (cacheHit) {
    return (
      <div className={cn(
        'inline-flex items-center rounded-full border font-medium',
        'bg-accent/10 text-accent border-accent/20',
        sizeClasses[size]
      )}>
        <Database size={iconSizes[size]} />
        <span>⚡ Cached</span>
      </div>
    );
  }

  return (
    <div className={cn(
      'inline-flex items-center rounded-full border font-medium',
      'bg-muted text-muted-foreground border-border',
      sizeClasses[size]
    )}>
      <Server size={iconSizes[size]} />
      <span>Fresh Response</span>
    </div>
  );
}
