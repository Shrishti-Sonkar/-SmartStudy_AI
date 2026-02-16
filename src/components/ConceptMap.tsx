
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, GitBranch, BookOpen } from 'lucide-react';

interface ConceptNode {
    id: string;
    name: string;
    prerequisites: string[];
    bloom_level: number;
}

export function ConceptMap() {
    const [nodes, setNodes] = useState<ConceptNode[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGraph();
    }, []);

    const fetchGraph = async () => {
        try {
            const { data, error } = await supabase.functions.invoke('ask', {
                body: { action: 'get_concept_graph' }
            });
            if (data?.nodes) {
                setNodes(data.nodes);
            }
        } catch (err) {
            console.error("Failed to fetch graph", err);
        } finally {
            setLoading(false);
        }
    };

    const getBloomColor = (level: number) => {
        switch (level) {
            case 1: return "bg-gray-200 text-gray-800";
            case 2: return "bg-blue-100 text-blue-800";
            case 3: return "bg-green-100 text-green-800";
            case 4: return "bg-yellow-100 text-yellow-800";
            case 5: return "bg-orange-100 text-orange-800";
            case 6: return "bg-red-100 text-red-800";
            default: return "bg-gray-100";
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <ScrollArea className="h-[500px] w-full pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nodes.map((node) => (
                    <Card key={node.id} className="relative overflow-hidden border-l-4 border-l-primary">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    {node.name}
                                </CardTitle>
                                <Badge className={getBloomColor(node.bloom_level)}>
                                    Lvl {node.bloom_level}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-gray-500 mb-2">
                                ID: <span className="font-mono text-xs">{node.id}</span>
                            </div>
                            {node.prerequisites.length > 0 ? (
                                <div className="mt-2">
                                    <div className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1 mb-1">
                                        <GitBranch className="h-3 w-3" /> Prerequisites
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {node.prerequisites.map(p => (
                                            <Badge key={p} variant="outline" className="text-xs">
                                                {p}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs text-green-600 italic mt-2">Foundational Concept</div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </ScrollArea>
    );
}
