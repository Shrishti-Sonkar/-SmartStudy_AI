import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, TrendingDown, Database, Zap, Brain, Sparkles, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAggregatedStats, useAnalytics } from '@/hooks/useAnalytics';
import { useQueryHistory } from '@/hooks/useQueryHistory';
import { useHumanFeedback } from '@/hooks/useHumanFeedback';
import { HallucinationBadge } from '@/components/HallucinationBadge';
import { ModelBadge } from '@/components/ModelBadge';
import { RiskBadge } from '@/components/RiskBadge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { useMemo } from 'react';

const COLORS = ['hsl(270, 80%, 55%)', 'hsl(220, 90%, 55%)', 'hsl(175, 70%, 45%)'];
const RISK_COLORS = { high: 'hsl(0, 80%, 55%)', medium: 'hsl(45, 90%, 50%)', low: 'hsl(142, 70%, 45%)' };

const Admin = () => {
  const { stats, isLoading: statsLoading } = useAggregatedStats();
  const { data: history, isLoading: historyLoading } = useQueryHistory(50);
  const { data: feedback } = useHumanFeedback(50);

  const modelData = stats ? [
    { name: 'LLM-1 (Fast)', value: stats.modelDistribution.llm1 },
    { name: 'LLM-2 (Concept)', value: stats.modelDistribution.llm2 },
    { name: 'LLM-3 (Deep)', value: stats.modelDistribution.llm3 },
  ] : [];

  // Trust score trend data from query logs
  const trustTrendData = useMemo(() => {
    if (!history) return [];
    return [...history]
      .filter(q => q.trust_score != null)
      .reverse()
      .map((q, i) => ({
        index: i + 1,
        trustScore: Number(q.trust_score),
        question: q.question.slice(0, 30) + (q.question.length > 30 ? '…' : ''),
      }));
  }, [history]);

  // Risk distribution from query logs
  const riskDistribution = useMemo(() => {
    if (!history) return [];
    const counts = { high: 0, medium: 0, low: 0 };
    history.forEach(q => {
      const level = (q.risk_level || 'medium').toLowerCase();
      if (level in counts) counts[level as keyof typeof counts]++;
    });
    return [
      { name: 'High Risk', value: counts.high, fill: RISK_COLORS.high },
      { name: 'Medium Risk', value: counts.medium, fill: RISK_COLORS.medium },
      { name: 'Low Risk', value: counts.low, fill: RISK_COLORS.low },
    ];
  }, [history]);

  // Feedback stats
  const feedbackStats = useMemo(() => {
    if (!feedback) return { approved: 0, overridden: 0, byRisk: [] as { risk: string; approved: number; overridden: number }[] };
    const approved = feedback.filter(f => f.decision === 'approved').length;
    const overridden = feedback.filter(f => f.decision === 'overridden').length;
    const riskMap: Record<string, { approved: number; overridden: number }> = {};
    feedback.forEach(f => {
      const r = f.risk_level || 'unknown';
      if (!riskMap[r]) riskMap[r] = { approved: 0, overridden: 0 };
      riskMap[r][f.decision === 'approved' ? 'approved' : 'overridden']++;
    });
    const byRisk = Object.entries(riskMap).map(([risk, vals]) => ({ risk, ...vals }));
    return { approved, overridden, byRisk };
  }, [feedback]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm"><ArrowLeft size={16} className="mr-2" />Back</Button>
            </Link>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">Analytics Dashboard</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="gap-1"><BarChart3 size={14} />Overview</TabsTrigger>
            <TabsTrigger value="trust" className="gap-1"><ShieldCheck size={14} />Trust & Feedback</TabsTrigger>
          </TabsList>

          {/* === OVERVIEW TAB === */}
          <TabsContent value="overview">
            {/* Stats cards */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Queries</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{stats?.totalQueries || 0}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Database size={14} />Cache Hit Rate</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold text-accent">{stats?.cacheHitRate.toFixed(1) || 0}%</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Avg Hallucination</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{(stats?.avgHallucinationScore || 0).toFixed(2)}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><TrendingDown size={14} />Avg Cost Saved</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold text-success">{stats?.avgCostSaved.toFixed(0) || 0}%</p></CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader><CardTitle className="text-lg">Model Usage Distribution</CardTitle></CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={modelData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                        {modelData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Model Legend</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3"><Zap className="text-llm1" /><div><p className="font-medium">LLM-1: Fast Recall</p><p className="text-sm text-muted-foreground">T5 Model</p></div></div>
                  <div className="flex items-center gap-3"><Brain className="text-llm2" /><div><p className="font-medium">LLM-2: Concept Understanding</p><p className="text-sm text-muted-foreground">Groq Mixtral-8x7B</p></div></div>
                  <div className="flex items-center gap-3"><Sparkles className="text-llm3" /><div><p className="font-medium">LLM-3: Deep Reasoning</p><p className="text-sm text-muted-foreground">HuggingFace LLaMA-3-8B</p></div></div>
                </CardContent>
              </Card>
            </div>

            {/* Query logs */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Recent Queries</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b"><th className="text-left py-2 px-2">Question</th><th className="text-left py-2 px-2">Model</th><th className="text-left py-2 px-2">Hallucination</th><th className="text-left py-2 px-2">Cache</th><th className="text-left py-2 px-2">Saved</th></tr></thead>
                    <tbody>
                      {history?.slice(0, 10).map((q) => (
                        <tr key={q.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-2 px-2 max-w-xs truncate">{q.question}</td>
                          <td className="py-2 px-2"><ModelBadge tier={q.model_tier} name={q.model_used} size="sm" /></td>
                          <td className="py-2 px-2"><HallucinationBadge score={Number(q.hallucination_score)} size="sm" showLabel={false} /></td>
                          <td className="py-2 px-2">{q.cache_hit ? '⚡' : '—'}</td>
                          <td className="py-2 px-2 text-success font-medium">{q.cost_saved_percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === TRUST & FEEDBACK TAB === */}
          <TabsContent value="trust">
            {/* Summary cards */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Avg Trust Score</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {history && history.filter(q => q.trust_score != null).length > 0
                      ? (history.filter(q => q.trust_score != null).reduce((s, q) => s + Number(q.trust_score), 0) / history.filter(q => q.trust_score != null).length).toFixed(1)
                      : '—'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Feedback</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{feedback?.length || 0}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Approved</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold text-success">{feedbackStats.approved}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Overridden</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold text-destructive">{feedbackStats.overridden}</p></CardContent>
              </Card>
            </div>

            {/* Charts row */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Trust score trend */}
              <Card>
                <CardHeader><CardTitle className="text-lg">Trust Score Trend</CardTitle></CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trustTrendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis dataKey="index" label={{ value: 'Query #', position: 'insideBottom', offset: -5 }} tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
                              <p className="font-medium">{d.question}</p>
                              <p className="text-muted-foreground">Trust: <span className="font-bold text-foreground">{d.trustScore.toFixed(1)}</span></p>
                            </div>
                          );
                        }}
                      />
                      <Line type="monotone" dataKey="trustScore" stroke="hsl(270, 80%, 55%)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Risk distribution */}
              <Card>
                <CardHeader><CardTitle className="text-lg">Risk Level Distribution</CardTitle></CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                        {riskDistribution.map((entry, index) => (<Cell key={`risk-${index}`} fill={entry.fill} />))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Feedback by risk level */}
            {feedbackStats.byRisk.length > 0 && (
              <Card className="mb-8">
                <CardHeader><CardTitle className="text-lg">Human Feedback by Risk Level</CardTitle></CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={feedbackStats.byRisk}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis dataKey="risk" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="approved" fill="hsl(142, 70%, 45%)" name="Approved" />
                      <Bar dataKey="overridden" fill="hsl(0, 80%, 55%)" name="Overridden" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Recent feedback table */}
            <Card>
              <CardHeader><CardTitle className="text-lg">Recent Human Feedback</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b"><th className="text-left py-2 px-2">Question</th><th className="text-left py-2 px-2">Trust</th><th className="text-left py-2 px-2">Risk</th><th className="text-left py-2 px-2">Decision</th><th className="text-left py-2 px-2">Time</th></tr></thead>
                    <tbody>
                      {feedback?.slice(0, 10).map((f) => (
                        <tr key={f.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-2 px-2 max-w-xs truncate">{f.question}</td>
                          <td className="py-2 px-2 font-mono font-medium">{Number(f.trust_score).toFixed(1)}</td>
                          <td className="py-2 px-2"><RiskBadge level={f.risk_level as 'low' | 'medium' | 'high'} size="sm" /></td>
                          <td className="py-2 px-2">
                            <span className={f.decision === 'approved' ? 'text-success font-medium' : 'text-destructive font-medium'}>
                              {f.decision === 'approved' ? '✅ Approved' : '❌ Overridden'}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-muted-foreground">{new Date(f.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                      {(!feedback || feedback.length === 0) && (
                        <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No feedback recorded yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
