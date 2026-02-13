import { useState } from 'react';
import { Send, Loader2, BookOpen, Zap, Brain, Lightbulb, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type ModelTier = 'auto' | 'LLM-1' | 'LLM-2' | 'LLM-3';

interface QuestionInputProps {
  onSubmit: (question: string, modelTier?: ModelTier) => void;
  isLoading: boolean;
  placeholder?: string;
}

const EXAMPLE_QUESTIONS = [
  "What is photosynthesis?",
  "Explain how neural networks learn",
  "Prove that the square root of 2 is irrational"
];

const MODEL_OPTIONS: { value: ModelTier; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'auto', label: 'Auto Select', description: 'Let AI choose the best model', icon: <Zap size={16} className="text-primary" /> },
  { value: 'LLM-1', label: 'Fast Recall', description: 'Quick definitions & facts', icon: <Lightbulb size={16} className="text-llm1" /> },
  { value: 'LLM-2', label: 'Concept Understanding', description: 'Explanations & examples', icon: <Brain size={16} className="text-llm2" /> },
  { value: 'LLM-3', label: 'Deep Reasoning', description: 'Complex step-by-step', icon: <Brain size={16} className="text-llm3" /> },
];

export function QuestionInput({ onSubmit, isLoading, placeholder }: QuestionInputProps) {
  const [question, setQuestion] = useState('');
  const [selectedModel, setSelectedModel] = useState<ModelTier>('auto');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !isLoading) {
      onSubmit(question.trim(), selectedModel === 'auto' ? undefined : selectedModel);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const currentModelOption = MODEL_OPTIONS.find(m => m.value === selectedModel)!;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="relative">
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Ask me anything about your studies..."}
          className={cn(
            "min-h-[120px] resize-none pr-24 text-lg",
            "border-2 border-primary/20 focus:border-primary",
            "bg-card rounded-2xl shadow-soft",
            "placeholder:text-muted-foreground/60"
          )}
          disabled={isLoading}
        />
        <Button
          type="submit"
          disabled={!question.trim() || isLoading}
          className={cn(
            "absolute right-3 bottom-3",
            "gradient-primary text-primary-foreground",
            "rounded-xl px-6 h-12",
            "shadow-lg hover:shadow-xl transition-all",
            "disabled:opacity-50"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Thinking...
            </>
          ) : (
            <>
              <Send className="mr-2 h-5 w-5" />
              Get Answer
            </>
          )}
        </Button>
      </form>

      {/* Model selector and example questions row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Model selector dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 bg-card border-border hover:bg-secondary"
              disabled={isLoading}
            >
              {currentModelOption.icon}
              <span className="hidden sm:inline">{currentModelOption.label}</span>
              <ChevronDown size={14} className="text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-popover border-border z-50">
            {MODEL_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setSelectedModel(option.value)}
                className={cn(
                  "flex items-start gap-3 p-3 cursor-pointer",
                  selectedModel === option.value && "bg-primary/10"
                )}
              >
                <div className="mt-0.5">{option.icon}</div>
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-4 w-px bg-border hidden sm:block" />

        {/* Example questions */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <BookOpen size={14} />
            Try:
          </span>
          {EXAMPLE_QUESTIONS.map((example, index) => (
            <button
              key={index}
              onClick={() => setQuestion(example)}
              disabled={isLoading}
              className={cn(
                "text-sm px-3 py-1.5 rounded-full",
                "bg-secondary text-secondary-foreground",
                "hover:bg-primary/10 hover:text-primary",
                "transition-colors border border-transparent hover:border-primary/20",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
