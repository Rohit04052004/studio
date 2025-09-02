
'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, User, Bot, LoaderCircle, ShieldAlert, BrainCircuit, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { askHealthAssistantAction, getAssistantChatAction, deleteAssistantChatAction } from '@/app/actions';
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

function ChatView({
    messages,
    input,
    setInput,
    handleSubmit,
    isPending,
    isInitialLoad,
    handleSuggestionClick
}: {
    messages: Message[];
    input: string;
    setInput: (value: string) => void;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    isPending: boolean;
    isInitialLoad: boolean;
    handleSuggestionClick: (question: string) => void;
}) {
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    
    useEffect(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    return (
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-grow pr-4 -mr-4" viewportRef={scrollAreaRef}>
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
        </div>
    );
}

function InitialView({
    input,
    setInput,
    handleSubmit,
    isPending,
    handleSuggestionClick
}: {
    input: string;
    setInput: (value: string) => void;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    isPending: boolean;
    handleSuggestionClick: (question: string) => void;
}) {
    const { user } = useAuth();
    return (
        <div className="h-full w-full flex flex-col justify-between">
            <div className="flex-grow flex flex-col items-center justify-center text-center">
                 <BrainCircuit className="h-12 w-12 text-primary" />
                <h2 className="text-3xl font-bold mt-4">How can I help you today?</h2>
            </div>
            <div className="pb-8 px-4">
                {isPending ? (
                     <div className="flex items-center justify-center gap-2">
                        <LoaderCircle className="h-6 w-6 animate-spin" />
                        <span className="text-muted-foreground">Thinking...</span>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                            {suggestedQuestions.map((q) => (
                                <Button key={q} variant="outline" size="sm" className="h-auto justify-start text-left py-2" onClick={() => handleSuggestionClick(q)}>
                                    {q}
                                </Button>
                            ))}
                        </div>
                        <form id="chat-form" onSubmit={handleSubmit} className="flex items-center gap-2 pt-4 border-t">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask a health question, e.g., 'What are normal cholesterol levels?'"
                                disabled={isPending || !user}
                                className="h-12 text-base"
                            />
                            <Button type="submit" size="icon" className="h-12 w-12" disabled={isPending || !input.trim() || !user}>
                                <Send className="h-5 w-5" />
                                <span className="sr-only">Send</span>
                            </Button>
                        </form>
                    </>
                )}
                 <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground mt-4">
                    <ShieldAlert className="h-4 w-4" />
                    <p>This is for educational purposes only. Always consult healthcare professionals.</p>
                </div>
            </div>
        </div>
    );
}

export function AssistantClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isClearing, startClearingTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    async function loadHistory() {
        if (user) {
            setIsLoadingHistory(true);
            const result = await getAssistantChatAction(user.uid);
            if (result.success && result.chat && result.chat.history.length > 0) {
                const historyWithDates = result.chat.history.map(m => ({
                    ...m,
                    createdAt: new Date(m.createdAt)
                }));
                setMessages(historyWithDates);
                setIsInitialLoad(false);
            } else {
                setMessages([]);
                setIsInitialLoad(true);
            }
            if (!result.success) {
                setError(result.error || 'Failed to load chat history.');
            }
            setIsLoadingHistory(false);
        } else if (!authLoading) {
            setIsLoadingHistory(false);
            setMessages([]);
            setIsInitialLoad(true);
        }
    }
    loadHistory();
  }, [user, authLoading]);
  
  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error,
      });
      setError(null); // Reset error after showing toast
    }
  }, [error, toast]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || !user || isPending) return;

    const userMessage: Message = { role: 'user', content: input, createdAt: new Date() };
    const currentInput = input;
    
    // Switch to chat view on first message
    if (isInitialLoad) {
        setIsInitialLoad(false);
    }
    
    const currentHistory = messages;
    setMessages([...currentHistory, userMessage, { role: 'assistant', content: '', isPending: true, createdAt: new Date() }]);
    setInput('');

    startTransition(async () => {
      const result = await askHealthAssistantAction(user.uid, currentInput, [...currentHistory, userMessage]);

      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];

        if (lastMessage.isPending) {
            if (result.success && result.answer) {
                lastMessage.content = result.answer;
            } else {
                lastMessage.content = "Sorry, I couldn't get an answer. Please try again.";
                setError(result.error || 'An unknown error occurred.');
            }
            lastMessage.isPending = false;
        }
        return newMessages;
      });
    });
  };

  const handleSuggestionClick = (question: string) => {
    if(!user || isPending) return;
    setInput(question);
    setTimeout(() => {
        const form = document.getElementById('chat-form') as HTMLFormElement;
        if (form) {
            form.requestSubmit();
        }
    }, 100);
  };
  
  const handleNewChat = () => {
      if (!user) return;
      startClearingTransition(async () => {
          const result = await deleteAssistantChatAction(user.uid);
          if (result.success) {
              setMessages([]);
              setIsInitialLoad(true);
              toast({ title: 'Success', description: 'Chat history cleared.' });
          } else {
              setError(result.error || 'Failed to start a new chat.');
          }
      });
  }

  const renderContent = () => {
    if (isLoadingHistory || authLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (isInitialLoad) {
      return (
        <InitialView
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          isPending={isPending}
          handleSuggestionClick={handleSuggestionClick}
        />
      );
    }

    return (
        <ChatView
            messages={messages}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isPending={isPending}
            isInitialLoad={isInitialLoad}
            handleSuggestionClick={handleSuggestionClick}
        />
    );
  };

  return (
    <div className="flex flex-col items-center w-full h-full">
        <div className="text-center my-4 w-full max-w-4xl flex justify-between items-center relative px-4">
             <div className="flex items-center gap-2">
                <BrainCircuit className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold tracking-tight">AI Health Assistant</h1>
            </div>
             {(!isInitialLoad && !isLoadingHistory) && (
                <Button 
                    variant="outline"
                    onClick={handleNewChat}
                    disabled={isClearing}
                >
                    {isClearing ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    New Chat
                </Button>
             )}
        </div>

        <Card className="w-full max-w-4xl mx-auto flex-grow flex flex-col">
            <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden p-6 h-full">
                {renderContent()}
            </CardContent>
        </Card>
    </div>
  );
}
