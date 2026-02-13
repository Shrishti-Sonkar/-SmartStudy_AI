import { useState } from 'react';
import { GraduationCap, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { QuestionInput } from '@/components/QuestionInput';
import { AnswerDisplay } from '@/components/AnswerDisplay';
import { QueryHistorySidebar } from '@/components/QueryHistorySidebar';
import { useAsk } from '@/hooks/useAsk';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { askQuestion, isLoading, response, clearResponse } = useAsk();
  const [currentQuestion, setCurrentQuestion] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (question: string, modelTier?: string) => {
    setCurrentQuestion(question);
    const result = await askQuestion(question, modelTier);
    if (!result) {
      toast({
        title: "Error",
        description: "Failed to get an answer. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleNewQuestion = () => {
    clearResponse();
    setCurrentQuestion('');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl gradient-primary">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">SmartStudy AI</h1>
              <p className="text-xs text-muted-foreground">Waste-Aware Learning Assistant</p>
            </div>
          </div>
          <Link to="/admin">
            <Button variant="outline" size="sm" className="gap-2">
              <BarChart3 size={16} />
              Analytics
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-80 border-r border-border bg-sidebar min-h-[calc(100vh-73px)]">
          <QueryHistorySidebar />
        </aside>

        {/* Main content */}
        <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
          {/* Hero section */}
          {!response && (
            <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="gradient-text">Learn Smarter,</span>
                <br />
                <span className="text-foreground">Not Harder</span>
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Ask any question and get accurate answers from our intelligent multi-model system 
                that minimizes AI waste and reduces hallucinations.
              </p>
            </div>
          )}

          {/* Question input or answer display */}
          {response ? (
            <AnswerDisplay 
              response={response} 
              question={currentQuestion}
              onNewQuestion={handleNewQuestion}
            />
          ) : (
            <QuestionInput onSubmit={handleSubmit} isLoading={isLoading} />
          )}

          {/* Features row */}
          {!response && (
            <div className="grid md:grid-cols-3 gap-4 mt-12">
              {[
                { icon: '🎯', title: 'Smart Routing', desc: 'Questions matched to optimal AI models' },
                { icon: '🛡️', title: 'Hallucination Check', desc: 'Every answer scored for reliability' },
                { icon: '♻️', title: 'Waste Reduction', desc: 'Semantic caching saves computation' }
              ].map((feature, i) => (
                <div key={i} className="p-4 rounded-xl bg-card border border-border text-center">
                  <span className="text-2xl">{feature.icon}</span>
                  <h3 className="font-medium mt-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{feature.desc}</p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
