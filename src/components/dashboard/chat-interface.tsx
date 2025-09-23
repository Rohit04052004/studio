
'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import type { Report, Message } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, User, Bot, LoaderCircle, MessageCircleQuestion } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { askQuestionAction } from '@/app/actions';
import { cn } from '@/lib/utils';
import { Markdown } from '../markdown';

interface ChatInterfaceProps {
  report: Report | null;
  onUpdateChat: (reportId: string, newMessages: Message[]) => void;
}

export function ChatInterface({ report, onUpdateChat }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [report?.chatHistory]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || !report) return;

    const userMessage: Message = { role: 'user', content: input, createdAt: new Date().toISOString() };
    const currentInput = input;
    const optimisticHistory = [...(report.chatHistory || []), userMessage, { role: 'assistant', content: '', isPending: true, createdAt: new Date().toISOString() }];

    onUpdateChat(report.id, optimisticHistory);
    setInput('');

    startTransition(async () => {
      const context = report.originalText || report.summary || '';
      const result = await askQuestionAction(report.id, context, currentInput);
      
      const finalHistory = [...(report.chatHistory || []), userMessage];
      if (result.success && result.answer) {
        const assistantMessage: Message = { role: 'assistant', content: result.answer, createdAt: new Date().toISOString() };
        onUpdateChat(report.id, [...finalHistory, assistantMessage]);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
        // Remove the pending message on error
        onUpdateChat(report.id, finalHistory);
      }
    });
  };

  return (
    <div className="flex flex-col h-full gap-4 pt-4">
        <ScrollArea className="flex-grow pr-4 -mr-4" viewportRef={scrollAreaRef}>
          <div className="space-y-4">
            {!report ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4 min-h-[200px]">
                <p>Select a report to start a conversation.</p>
              </div>
            ) : (report.chatHistory || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4 min-h-[200px]">
                    <p>Ask a question about "{report.name}" to begin.</p>
              </div>
            ) : (
              (report.chatHistory || []).map((message, index) => (
                <div
                  key={`${report.id}-msg-${index}`}
                  className={cn('flex items-start gap-3', message.role === 'user' ? 'justify-end' : '')}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        <Bot className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      'max-w-xs md:max-w-md rounded-lg p-3 text-sm',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {message.isPending ? (
                      <div className="flex items-center gap-2">
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        <span>Thinking...</span>
                      </div>
                    ) : (
                      <Markdown content={message.content} />
                    )}
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-4 border-t">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={report ? 'Type your question...' : 'Select a report first'}
            disabled={isPending || !report}
          />
          <Button type="submit" size="icon" disabled={isPending || !input.trim() || !report}>
            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
  );
}
