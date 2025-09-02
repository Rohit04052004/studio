
'use client';

import { useState } from 'react';
import type { Report, AssistantChat, Message } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, History, ListFilter, MessageSquare, Search, Bot, User, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';


interface HistoryClientProps {
    initialReports: Report[];
    initialAssistantChat: AssistantChat | null;
}

export function HistoryClient({ initialReports, initialAssistantChat }: HistoryClientProps) {
  const [reports] = useState<Report[]>(initialReports);
  const [assistantChat] = useState<AssistantChat | null>(initialAssistantChat);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<Report | AssistantChat | null>(null);

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
  
  const allItems: (Report | AssistantChat)[] = [...filteredReports];
  if (filteredActiveAssistantChat) {
    if(!allItems.some(item => 'history' in item && 'userId' in item && item.userId === filteredActiveAssistantChat.userId && !('name' in item))) {
      allItems.unshift(filteredActiveAssistantChat);
    }
  }
  
  const allChatItems: (Report | AssistantChat)[] = [...filteredReportAndArchivedChats];
   if (filteredActiveAssistantChat) {
     if(!allChatItems.some(item => 'history' in item && 'userId' in item && item.userId === filteredActiveAssistantChat.userId && !('name' in item))) {
        allChatItems.unshift(filteredActiveAssistantChat);
     }
  }

  const reportsOnly = filteredReports.filter(r => r.type !== 'assistant');

  const handleCardClick = (item: Report | AssistantChat) => {
    setSelectedItem(item);
  };

  const handleModalClose = () => {
    setSelectedItem(null);
  };

  const getModalTitle = () => {
    if (!selectedItem) return '';
    if ('name' in selectedItem) {
        return selectedItem.name;
    }
    return 'AI Health Assistant (Active)';
  }

  const getModalChatHistory = () => {
    if (!selectedItem) return [];
    if ('name' in selectedItem) { // Report
        return selectedItem.chatHistory;
    }
    return selectedItem.history; // AssistantChat
  }


  return (
    <>
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
              </Tabs-Trigger>
            </TabsList>

            <TabsContent value="all">
                <HistoryList items={allItems} onCardClick={handleCardClick} />
            </TabsContent>
            <TabsContent value="reports">
                <HistoryList items={reportsOnly} onCardClick={handleCardClick} />
            </TabsContent>
            <TabsContent value="chats">
                 <HistoryList items={allChatItems} onCardClick={handleCardClick} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Dialog open={!!selectedItem} onOpenChange={(isOpen) => !isOpen && handleModalClose()}>
        <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle className="truncate pr-8">{getModalTitle()}</DialogTitle>
                 <DialogClose asChild>
                    <Button variant="ghost" size="icon" className="absolute top-4 right-4">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </Button>
                </DialogClose>
            </DialogHeader>
            <div className="flex-grow overflow-hidden">
                <ChatHistory messages={getModalChatHistory()} />
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


function HistoryList({ items, onCardClick }: { items: (Report | AssistantChat)[], onCardClick: (item: Report | AssistantChat) => void }) {
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
              return new Date(dateB as string).getTime() - new Date(dateA as string).getTime();
            })
            .map((item, index) => {
                if ('name' in item) { // It's a Report (including archived chats)
                    return <ReportHistoryItem key={item.id || `report-${index}`} report={item} onCardClick={() => onCardClick(item)} />;
                } else if ('history' in item) { // It's an active AssistantChat
                    return <AssistantChatHistoryItem key={item.userId || `chat-${index}`} chat={item} onCardClick={() => onCardClick(item)} />;
                }
                return null;
            })}
        </div>
    )
}

function ReportHistoryItem({ report, onCardClick }: { report: Report, onCardClick: () => void }) {
    const isArchivedChat = report.type === 'assistant';
    const description = isArchivedChat 
        ? "Archived AI health conversation." 
        : "AI-generated summary and analysis.";
    const firstUserMessage = report.chatHistory.find(m => m.role === 'user')?.content;
    const content = isArchivedChat
      ? `Started with: "${firstUserMessage?.substring(0, 70) || 'General questions'}${firstUserMessage && firstUserMessage.length > 70 ? '...' : ''}"`
      : report.summary?.substring(0, 150) + (report.summary && report.summary.length > 150 ? '...' : '');

    return (
        <Card onClick={onCardClick} className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        {isArchivedChat ? <Bot /> : <FileText />} 
                        {report.name}
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">{format(new Date(report.createdAt), 'PP')}</span>
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{content}</p>
            </CardContent>
        </Card>
    )
}

function AssistantChatHistoryItem({ chat, onCardClick }: { chat: AssistantChat, onCardClick: () => void }) {
     return (
        <Card onClick={onCardClick} className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><Bot /> AI Health Assistant (Active)</span>
                    <span className="text-sm font-normal text-muted-foreground">Last updated {format(new Date(chat.updatedAt), 'PP p')}</span>
                </CardTitle>
                 <CardDescription>Current general health Q&A conversation.</CardDescription>
            </CardHeader>
             <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {chat.history[chat.history.length-1]?.content}
                </p>
            </CardContent>
        </Card>
    )
}

function ChatHistory({ messages }: { messages: Message[] }) {
    if (!messages || messages.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>No conversation history for this item.</p>
            </div>
        )
    }

    return (
        <ScrollArea className="h-full w-full rounded-md pr-4 -mr-4">
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
                        'max-w-md rounded-lg p-3 text-sm',
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
