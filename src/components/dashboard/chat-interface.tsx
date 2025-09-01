
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

    const userMessage: Message = { role: 'user', content: input, createdAt: new Date() };
    const pendingMessage: Message = { role: 'assistant', content: '', isPending: true, createdAt: new Date() };
    
    // Optimistically update UI
    const newChatHistory = [...(report.chatHistory || []), userMessage, pendingMessage];
    onUpdateChat(report.id, newChatHistory);
    
    const currentInput = input;
    setInput('');

    startTransition(async () => {
      const context = report.originalText || report.summary;
      const result = await askQuestionAction(report.id, context, currentInput);
      
      // Update UI with actual response
      setMessages(prev => {
        const updatedMessages = prev.filter(m => !m.isPending);
        if (result.success && result.answer) {
          const assistantMessage: Message = { role: 'assistant', content: result.answer, createdAt: new Date() };
          const finalHistory = [...(report.chatHistory || []), userMessage, assistantMessage];
           // This is tricky because the parent state has changed.
           // A better approach might involve a global state manager or passing down the full report update function.
           // For now, we assume the parent will refetch or handle the update.
           // This optimistic UI will be out of sync until a reload. A proper implementation is needed.
           onUpdateChat(report.id, finalHistory);

        } else {
            toast({
              variant: 'destructive',
              title: 'Error',
              description: result.error,
            });
            const errorMessage: Message = { role: 'assistant', content: "Sorry, I couldn't get an answer. Please try again.", createdAt: new Date() };
            const finalHistory = [...(report.chatHistory || []), userMessage, errorMessage];
            onUpdateChat(report.id, finalHistory);
        }
      });
    });
  };

  const setMessages = (update: (prev: Message[]) => Message[]) => {
      if(!report) return;
      const newMessages = update(report.chatHistory || []);
      onUpdateChat(report.id, newMessages);
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <MessageCircleQuestion className="h-5 w-5" />
            Ask About Your Report
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden">
        <ScrollArea className="flex-grow pr-4 -mr-4" ref={scrollAreaRef}>
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
                      <p className="whitespace-pre-wrap">{message.content}</p>
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
      </CardContent>
    </Card>
  );
}
