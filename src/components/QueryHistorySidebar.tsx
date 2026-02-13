import { History, ChevronRight, AlertCircle } from 'lucide-react';
import { useQueryHistory, QueryLog } from '@/hooks/useQueryHistory';
import { HallucinationBadge } from './HallucinationBadge';
import { ModelBadge } from './ModelBadge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface QueryHistorySidebarProps {
  onSelectQuery?: (query: QueryLog) => void;
}

export function QueryHistorySidebar({ onSelectQuery }: QueryHistorySidebarProps) {
  const { data: history, isLoading, error } = useQueryHistory(15);

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <History size={18} />
          <span className="font-medium">Recent Questions</span>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  // Handle case where error is due to empty table or permission (show empty state instead of error)
  if (error) {
    // If it's a "relation does not exist" or permission error, treat as empty history
    if (error.message?.includes('relation "public.query_logs" does not exist') ||
      error.message?.includes('permission denied')) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          <p className="text-sm">Start by asking a question!</p>
        </div>
      );
    }

    return (
      <div className="p-4">
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <div className="flex items-center gap-2 mb-1 font-medium">
            <AlertCircle size={14} />
            <span>History unavailable</span>
          </div>
          <p className="text-xs opacity-90">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 text-foreground">
          <History size={18} />
          <span className="font-medium">Recent Questions</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {history && history.length > 0 ? (
            history.map((query) => (
              <button
                key={query.id}
                onClick={() => onSelectQuery?.(query)}
                className={cn(
                  "w-full text-left p-3 rounded-lg",
                  "bg-card hover:bg-muted/50 border border-border",
                  "transition-all hover:shadow-sm",
                  "group"
                )}
              >
                <p className="text-sm font-medium text-foreground line-clamp-2 mb-2">
                  {query.question}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <HallucinationBadge score={Number(query.hallucination_score)} size="sm" showLabel={false} />
                  <ModelBadge tier={query.model_tier} name={query.model_used} size="sm" />
                  {query.cache_hit && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                      ⚡ Cached
                    </span>
                  )}
                </div>
                <ChevronRight
                  size={16}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              <p className="text-sm">No questions yet</p>
              <p className="text-xs mt-1">Your history will appear here</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
