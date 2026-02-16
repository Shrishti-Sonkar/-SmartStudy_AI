import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAsk, AskResponse } from '@/hooks/useAsk';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface BenchmarkQuestion {
    question: string;
    type: 'factual' | 'tricky';
    topic: string;
}

interface TestResult extends AskResponse {
    question: string;
    type: 'factual' | 'tricky';
    status: 'passed' | 'failed' | 'escalated';
}

export function ReliabilityTester() {
    const { askQuestion } = useAsk();
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [questions, setQuestions] = useState<BenchmarkQuestion[]>([]);
    const [results, setResults] = useState<TestResult[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const runTest = async () => {
        setIsRunning(true);
        setProgress(0);
        setResults([]);
        setQuestions([]);
        setCurrentQuestionIndex(0);

        try {
            // 1. Generate Questions
            // 1. Generate Questions
            // NOTE: useAsk hook might need update to support custom body/actions or we direct fetch here for simplicity
            // For now, let's assume we can pass a special flag or use a direct fetch for the generator

            // Direct fetch to bypass useAsk structure for this specific admin action
            const { data, error } = await supabase.functions.invoke('ask', {
                body: { action: 'generate_benchmark' }
            });

            if (error) throw new Error(error.message);
            if (!data.questions) throw new Error("Failed to generate questions");

            const benchmarkQuestions: BenchmarkQuestion[] = data.questions;
            setQuestions(benchmarkQuestions);

            // 2. Run Loop
            const newResults: TestResult[] = [];
            for (let i = 0; i < benchmarkQuestions.length; i++) {
                setCurrentQuestionIndex(i + 1);
                setProgress(((i + 1) / benchmarkQuestions.length) * 100);

                const q = benchmarkQuestions[i];
                const { data: res } = await askQuestion(q.question);

                if (res) {
                    newResults.push({
                        ...res,
                        question: q.question,
                        type: q.type,
                        status: res.risk_level === 'high' ? 'escalated' : 'passed'
                    });
                    setResults([...newResults]);
                }

                // Small delay to be nice
                await new Promise(r => setTimeout(r, 500));
            }

        } catch (e) {
            console.error("Test failed", e);
        } finally {
            setIsRunning(false);
        }
    };

    // Metrics
    const avgConfidence = results.length ? Math.round(results.reduce((acc, r) => acc + r.confidence_score, 0) / results.length * 100) : 0;
    const escalationRate = results.length ? Math.round(results.filter(r => r.status === 'escalated').length / results.length * 100) : 0;
    const trickyAccuracy = results.filter(r => r.type === 'tricky').length; // Mock, hard to know "accuracy" without ground truth, just count processed

    return (
        <div className="space-y-6 p-6 border rounded-xl bg-card">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <ShieldCheck className="text-primary" />
                        Adaptive Reliability Analyzer
                    </h3>
                    <p className="text-sm text-muted-foreground">Auto-run self-diagnosis on 10 generated questions.</p>
                </div>
                <Button onClick={runTest} disabled={isRunning}>
                    {isRunning ? <Loader2 className="animate-spin mr-2" /> : "Run Self Reliability Test"}
                </Button>
            </div>

            {isRunning && (
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress: {currentQuestionIndex}/{questions.length}</span>
                        <span>Generating & Testing...</span>
                    </div>
                    <Progress value={progress} />
                </div>
            )}

            {results.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg text-center">
                        <div className="text-2xl font-bold">{avgConfidence}%</div>
                        <div className="text-xs text-muted-foreground">Avg Confidence</div>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg text-center">
                        <div className="text-2xl font-bold text-yellow-600">{escalationRate}%</div>
                        <div className="text-xs text-muted-foreground">Escalation Rate</div>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">{100 - escalationRate}%</div>
                        <div className="text-xs text-muted-foreground">Consistency Score</div>
                    </div>
                </div>
            )}

            {results.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Question</TableHead>
                                <TableHead>Model Used</TableHead>
                                <TableHead>Conf.</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {results.map((r, i) => (
                                <TableRow key={i}>
                                    <TableCell className="capitalize text-xs text-muted-foreground">{r.type}</TableCell>
                                    <TableCell className="font-medium truncate max-w-[200px]" title={r.question}>{r.question}</TableCell>
                                    <TableCell className="text-xs">{r.model_used}</TableCell>
                                    <TableCell>{Math.round(r.confidence_score * 100)}%</TableCell>
                                    <TableCell>
                                        {r.status === 'passed' ?
                                            <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={14} /> Pass</span> :
                                            <span className="text-yellow-600 flex items-center gap-1"><AlertTriangle size={14} /> Review</span>
                                        }
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
