
'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, User, Bot, LoaderCircle, ShieldAlert, BrainCircuit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { askHealthAssistantAction } from '@/app/actions';
import { cn } from '@/lib/utils';
import { Markdown } from '@/components/markdown';
import { useAuth } from '@/hooks/use-auth';
import type { Message } from '@/types';


const initialMessage: Message = {
    role: 'assistant',
    content: "Hello! I'm your AI medical assistant. I can help answer questions about health topics, explain medical terms, and provide general health information. How can I help you today?",
    createdAt: new Date()
};

const suggestedQuestions = [
    'What does elevated white blood cell count mean?',
    'How should I prepare for a blood test?',
    'What are normal cholesterol levels?',
    'When should I see a cardiologist?',
];

export function AssistantClient() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const userMessage: Message = { role: 'user', content: input, createdAt: new Date() };
    const pendingMessage: Message = { role: 'assistant', content: '', isPending: true, createdAt: new Date() };
    
    const currentHistory = messages.slice(1); // Exclude the initial welcome message
    setMessages((prev) => [...prev, userMessage, pendingMessage]);
    const currentInput = input;
    setInput('');

    startTransition(async () => {
      const result = await askHealthAssistantAction(user.uid, currentInput, currentHistory);
      
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];

        if (lastMessage.isPending) {
            if (result.success && result.answer) {
                lastMessage.content = result.answer;
            } else {
                lastMessage.content = "Sorry, I couldn't get an answer. Please try again.";
                 toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: result.error,
                });
            }
            lastMessage.isPending = false;
        }
        return newMessages;
      });
    });
  };

  const handleSuggestionClick = (question: string) => {
    if(!user) return;
    setInput(question);
    // Use a timeout to allow state to update before submitting form
    setTimeout(() => {
        document.getElementById('chat-form')?.requestSubmit();
    }, 100);
  };

  return (
    <div className="flex flex-col items-center w-full">
        <div className="text-center my-8">
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
                <BrainCircuit className="h-10 w-10 text-primary" />
                AI Health Assistant
            </h1>
            <p className="text-muted-foreground mt-2">Ask questions about health topics and get evidence-based answers</p>
        </div>

        <Card className="w-full max-w-4xl mx-auto h-[75vh] flex flex-col">
            <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden p-6">
                <ScrollArea className="flex-grow pr-4 -mr-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                    {messages.map((message, index) => (
                    <div
                        key={`msg-${index}`}
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
                            'max-w-md rounded-lg p-3 text-sm',
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
                    ))}
                </div>
                </ScrollArea>
                <div className="mt-auto space-y-4">
                  {messages.length === 1 && (
                    <>
                      <p className="text-sm text-muted-foreground">Try asking:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {suggestedQuestions.map((q) => (
                              <Button key={q} variant="outline" size="sm" className="h-auto justify-start text-left py-2" onClick={() => handleSuggestionClick(q)}>
                                  {q}
                              </Button>
                          ))}
                      </div>
                    </>
                  )}
                    <form id="chat-form" onSubmit={handleSubmit} className="flex items-center gap-2 pt-4 border-t">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a health question..."
                            disabled={isPending || !user}
                        />
                        <Button type="submit" size="icon" disabled={isPending || !input.trim() || !user}>
                            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            <span className="sr-only">Send</span>
                        </Button>
                    </form>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <ShieldAlert className="h-4 w-4" />
                        <p>This is for educational purposes only. Always consult healthcare professionals.</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
