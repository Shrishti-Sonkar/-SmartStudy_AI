import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReferencePanelProps {
    references?: string[];
}

export function ReferencePanel({ references }: ReferencePanelProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!references || references.length === 0) return null;

    return (
        <div className="mt-4 rounded-lg border border-border bg-card">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors rounded-lg"
            >
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <BookOpen size={16} />
                    <span>Academic References & Citations</span>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isOpen && (
                <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                    <div className="p-4 rounded-lg bg-muted/30">
                        <ul className="space-y-3">
                            {references.map((ref, idx) => (
                                <li key={idx} className="text-sm text-foreground flex gap-3 items-start">
                                    <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-mono mt-0.5">
                                        {idx + 1}
                                    </span>
                                    <span className="leading-relaxed">
                                        {ref.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                                            part.match(/^https?:\/\//) ? (
                                                <a
                                                    key={i}
                                                    href={part}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:underline break-all font-medium"
                                                >
                                                    {part}
                                                </a>
                                            ) : (
                                                part
                                            )
                                        )}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
