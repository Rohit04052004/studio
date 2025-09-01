
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
          setReports(result.reports || []);
          setAssistantChat(result.assistantChat || null);
        }
        setLoading(false);
      } else if (!authLoading) {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, authLoading]);

  const filteredReports = reports.filter(report =>
    report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const reportChats = reports.filter(report => report.chatHistory.length > 0);

  const filteredReportChats = reportChats.filter(report =>
    report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.chatHistory.some(m => m.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredAssistantChat = assistantChat && assistantChat.history.some(m => m.content.toLowerCase().includes(searchTerm.toLowerCase())) ? assistantChat : null;

  const allItems = [...filteredReports, ...filteredReportChats];
  if(filteredAssistantChat) {
    allItems.push(filteredAssistantChat as any); // A bit of a hack for a unified view
  }


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
              Reports ({filteredReports.length})
            </TabsTrigger>
            <TabsTrigger value="chats">
              <MessageSquare className="mr-2 h-4 w-4" />
              Chats ({filteredReportChats.length + (filteredAssistantChat ? 1 : 0)})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
              <HistoryList items={allItems} type="all" />
          </TabsContent>
          <TabsContent value="reports">
              <HistoryList items={filteredReports} type="reports" />
          </TabsContent>
          <TabsContent value="chats">
               <HistoryList items={[...filteredReportChats, ...(filteredAssistantChat ? [filteredAssistantChat] : [])]} type="chats" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}


function HistoryList({ items, type }: { items: (Report | AssistantChat)[], type: 'all' | 'reports' | 'chats' }) {
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
            {items.map(item => {
                if ('name' in item) { // It's a Report
                    return <ReportHistoryItem key={item.id} report={item} />;
                } else if ('history' in item) { // It's an AssistantChat
                    return <AssistantChatHistoryItem key={item.userId} chat={item} />;
                }
                return null;
            })}
        </div>
    )
}

function ReportHistoryItem({ report }: { report: Report }) {
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
                <p className="text-sm p-4 bg-muted/50 rounded-lg">{report.summary}</p>
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
                    <span className="flex items-center gap-2"><Bot /> AI Health Assistant</span>
                    <span className="text-sm font-normal text-muted-foreground">Last updated {format(new Date(chat.updatedAt), 'PP')}</span>
                </CardTitle>
                 <CardDescription>General health Q&A conversation.</CardDescription>
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
