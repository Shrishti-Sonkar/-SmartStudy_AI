
import { BookOpen, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LearningPathPanelProps {
    learning_recommendations?: string[];
    learning_level?: string;
}

export function LearningPathPanel({ learning_recommendations, learning_level }: LearningPathPanelProps) {
    if (!learning_recommendations || learning_recommendations.length === 0) return null;

    const getLevelColor = (level?: string) => {
        switch (level) {
            case 'Strong': return 'text-green-600 bg-green-100 border-green-200';
            case 'Moderate': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
            case 'Needs Improvement': return 'text-red-600 bg-red-100 border-red-200';
            default: return 'text-muted-foreground bg-muted border-border';
        }
    };

    return (
        <div className="mt-6 p-4 rounded-xl border border-border bg-card/50">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <BookOpen className="text-primary h-5 w-5" />
                    Recommended Learning Path
                </h3>
                {learning_level && (
                    <span className={cn("px-3 py-1 rounded-full text-xs font-bold border", getLevelColor(learning_level))}>
                        {learning_level}
                    </span>
                )}
            </div>

            <div className="space-y-3">
                {learning_recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border/50">
                        {rec.includes("Revise") || rec.includes("Strengthen") ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                        ) : (
                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        )}
                        <p className="text-sm text-foreground">{rec}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
