
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getHistoryAction } from '../actions';
import { Report, AssistantChat, Message } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, History, ListFilter, MessageSquare, Search, LoaderCircle, Bot, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [assistantChat, setAssistantChat] = useState<AssistantChat | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (user) {
        setLoading(true);
        const result = await getHistoryAction(user.uid);
        if (result.success) {
          // Ensure reports are properly hydrated with Date objects
          const hydratedReports = result.reports?.map(r => ({
            ...r,
            createdAt: new Date(r.createdAt),
            chatHistory: r.chatHistory.map(m => ({ ...m, createdAt: new Date(m.createdAt)}))
          })) || [];
          setReports(hydratedReports);

          if (result.assistantChat) {
             const hydratedChat = {
                ...result.assistantChat,
                createdAt: new Date(result.assistantChat.createdAt),
                updatedAt: new Date(result.assistantChat.updatedAt),
                history: result.assistantChat.history.map(m => ({ ...m, createdAt: new Date(m.createdAt)}))
            };
            setAssistantChat(hydratedChat);
          } else {
            setAssistantChat(null);
          }
        }
        setLoading(false);
      } else if (!authLoading) {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, authLoading]);
  
  const searchLower = searchTerm.toLowerCase();

  const filteredReports = reports.filter(report =>
    (report.name && report.name.toLowerCase().includes(searchLower)) ||
    (report.summary && report.summary.toLowerCase().includes(searchLower)) ||
    (report.type === 'assistant' && report.chatHistory.some(m => m.content.toLowerCase().includes(searchLower)))
  );

  const filteredReportAndArchivedChats = reports.filter(report => 
    report.chatHistory.length > 0 &&
    (
        (report.name && report.name.toLowerCase().includes(searchLower)) ||
        report.chatHistory.some(m => m.content.toLowerCase().includes(searchLower))
    )
  );

  const filteredActiveAssistantChat = assistantChat && assistantChat.history.some(m => m.content.toLowerCase().includes(searchLower)) ? assistantChat : null;
  
  // Combine all items for the 'all' tab
  const allItems = [...filteredReports];
  if (filteredActiveAssistantChat) {
      // Add active chat only if it's not already represented (e.g. by an archived version)
      // This is a simple check, a more robust one would compare IDs if they existed
      if(!allItems.find(item => 'history' in item && item.userId === filteredActiveAssistantChat.userId)) {
          allItems.unshift(filteredActiveAssistantChat);
      }
  }
  
  // Combine all chat items
  const allChatItems = [...filteredReportAndArchivedChats];
   if (filteredActiveAssistantChat) {
       if(!allChatItems.find(item => 'history' in item && item.userId === filteredActiveAssistantChat.userId)) {
          allChatItems.unshift(filteredActiveAssistantChat);
       }
  }
  const reportsOnly = filteredReports.filter(r => r.type !== 'assistant');

  if (loading || authLoading) {
    return (
        <div className="flex items-center justify-center h-full">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">History</h1>
        <p className="mt-2 text-muted-foreground">
          View your past reports, analyses, and conversations
        </p>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your history..."
              className="pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <ListFilter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </Card>

      <div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              All ({allItems.length})
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="mr-2 h-4 w-4" />
              Reports ({reportsOnly.length})
            </TabsTrigger>
            <TabsTrigger value="chats">
              <MessageSquare className="mr-2 h-4 w-4" />
              Chats ({allChatItems.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
              <HistoryList items={allItems} />
          </TabsContent>
          <TabsContent value="reports">
              <HistoryList items={reportsOnly} />
          </TabsContent>
          <TabsContent value="chats">
               <HistoryList items={allChatItems} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}


function HistoryList({ items }: { items: (Report | AssistantChat)[] }) {
    if (items.length === 0) {
        return (
             <Card className="mt-4">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
                <History className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">No items found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your history will appear here as you use the app.
                </p>
              </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4 mt-4">
            {items.sort((a,b) => {
              const dateA = 'updatedAt' in a ? a.updatedAt : a.createdAt;
              const dateB = 'updatedAt' in b ? b.updatedAt : b.createdAt;
              return new Date(dateB).getTime() - new Date(dateA).getTime();
            })
            .map((item, index) => {
                if ('name' in item) { // It's a Report (including archived chats)
                    return <ReportHistoryItem key={item.id || `report-${index}`} report={item} />;
                } else if ('history' in item) { // It's an active AssistantChat
                    return <AssistantChatHistoryItem key={item.userId || `chat-${index}`} chat={item} />;
                }
                return null;
            })}
        </div>
    )
}

function ReportHistoryItem({ report }: { report: Report }) {
    if (report.type === 'assistant') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2"><Bot /> {report.name}</span>
                        <span className="text-sm font-normal text-muted-foreground">{format(new Date(report.createdAt), 'PP p')}</span>
                    </CardTitle>
                    <CardDescription>Archived AI health conversation.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChatHistory messages={report.chatHistory} />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><FileText /> {report.name}</span>
                    <span className="text-sm font-normal text-muted-foreground">{format(new Date(report.createdAt), 'PP')}</span>
                </CardTitle>
                <CardDescription>AI-generated summary and analysis.</CardDescription>
            </CardHeader>
            <CardContent>
                {report.summary && <p className="text-sm p-4 bg-muted/50 rounded-lg">{report.summary}</p>}
                {report.chatHistory.length > 0 && (
                     <details className="mt-4">
                        <summary className="cursor-pointer text-sm font-medium">View Conversation ({report.chatHistory.length} messages)</summary>
                        <ChatHistory messages={report.chatHistory} />
                    </details>
                )}
            </CardContent>
        </Card>
    )
}

function AssistantChatHistoryItem({ chat }: { chat: AssistantChat }) {
     return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><Bot /> AI Health Assistant (Active)</span>
                    <span className="text-sm font-normal text-muted-foreground">Last updated {format(new Date(chat.updatedAt), 'PP p')}</span>
                </CardTitle>
                 <CardDescription>Current general health Q&A conversation.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChatHistory messages={chat.history} />
            </CardContent>
        </Card>
    )
}

function ChatHistory({ messages }: { messages: Message[] }) {
    return (
        <ScrollArea className="h-64 w-full rounded-md border p-4 mt-2 bg-muted/30">
            <div className="space-y-4">
                {messages.map((message, index) => (
                <div
                    key={`chat-msg-${index}`}
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
                     <p className="whitespace-pre-wrap">{message.content}</p>
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
    )
}

    