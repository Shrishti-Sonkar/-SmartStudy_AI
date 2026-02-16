import { useState } from 'react';
import { GraduationCap, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { QuestionInput } from '@/components/QuestionInput';
import { AnswerDisplay } from '@/components/AnswerDisplay';
import { QueryHistorySidebar } from '@/components/QueryHistorySidebar';
import { useAsk } from '@/hooks/useAsk';
import { useToast } from '@/hooks/use-toast';
import { ReliabilityTester } from '@/components/ReliabilityTester';
import { LearningPathPanel } from '@/components/LearningPathPanel';
import { ConceptMap } from '@/components/ConceptMap';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Map as MapIcon } from 'lucide-react';

const Index = () => {
  const { askQuestion, isLoading, response, clearResponse } = useAsk();
  const [currentQuestion, setCurrentQuestion] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (question: string, modelTier?: string) => {
    setCurrentQuestion(question);
    const { data, error } = await askQuestion(question, modelTier);
    if (!data || error) {
      toast({
        title: "Error",
        description: error || "Failed to get an answer. Please try again.",
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
          {response && !isLoading ? (
            // Clarification Mode Logic
            response.confidence_score < 0.65 ? (
              <div className="p-6 rounded-2xl bg-card border-2 border-border shadow-soft animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-xl font-bold mb-4">We need a bit more clarity</h3>
                <p className="text-muted-foreground mb-6">
                  The confidence score for this query is low ({Math.round(response.confidence_score * 100)}%).
                  To give you the best answer, how would you like us to explain this?
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    size="lg"
                    className="h-auto py-4 flex flex-col items-start gap-2"
                    onClick={() => handleSubmit(`Conceptual explanation of: ${currentQuestion}`, 'high')}
                  >
                    <span className="font-bold text-lg">Thinking Process & Concept</span>
                    <span className="text-xs font-normal opacity-90">Explain the 'Why' and 'How' behind it.</span>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-start gap-2"
                    onClick={() => handleSubmit(`Step-by-step solution for: ${currentQuestion}`, 'high')}
                  >
                    <span className="font-bold text-lg">Step-by-Step Solution</span>
                    <span className="text-xs font-normal opacity-90">Just show me the math and steps.</span>
                  </Button>
                </div>
                <div className="mt-6 flex justify-center">
                  <Button variant="ghost" size="sm" onClick={() => clearResponse()}>Cancel</Button>
                </div>
              </div>
            ) : (
              <AnswerDisplay
                response={response}
                question={currentQuestion}
                onNewQuestion={handleNewQuestion}
              />
            )
          ) : (
            <QuestionInput onSubmit={handleSubmit} isLoading={isLoading} />
          )}

          {/* Reliability Tester (Added based on user request) */}
          {!response && !isLoading && (
            <div className="mt-12">
              <ReliabilityTester />
            </div>
          )}

          {/* Features row */}
          {!response && !isLoading && (
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
