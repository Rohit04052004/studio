
'use client';

import { useState, useEffect, useTransition } from 'react';
import type { Report, AssistantChat, Message } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, History, ListFilter, MessageSquare, Search, Bot, User, X, Trash2, LoaderCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { deleteReportAction, archiveAssistantChatAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface HistoryClientProps {
    initialReports: Report[];
    initialAssistantChat: AssistantChat | null;
}

const ClientFormattedDateTime = ({ date }: { date: string | Date }) => {
    const [formattedDate, setFormattedDate] = useState<string>('');

    useEffect(() => {
        setFormattedDate(format(new Date(date), 'PP p'));
    }, [date]);

    if (!formattedDate) {
        return null;
    }

    return <>{formattedDate}</>;
};

const ClientFormattedRelativeTime = ({ date }: { date: string | Date }) => {
    const [formattedDate, setFormattedDate] = useState<string>('');
    useEffect(() => {
        setFormattedDate(formatDistanceToNow(new Date(date), { addSuffix: true }));
    }, [date]);

    if (!formattedDate) {
        return null;
    }
    return <>{formattedDate}</>;
};


export function HistoryClient({ initialReports, initialAssistantChat }: HistoryClientProps) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [assistantChat, setAssistantChat] = useState<AssistantChat | null>(initialAssistantChat);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<Report | AssistantChat | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const searchLower = searchTerm.toLowerCase();

  const filteredReports = reports.filter(report =>
    (report.name && report.name.toLowerCase().includes(searchLower)) ||
    (report.summary && report.summary.toLowerCase().includes(searchLower)) ||
    (report.chatHistory.some(m => m.content.toLowerCase().includes(searchLower)))
  );
  
  const allChatItems = reports.filter(report => 
    (report.chatHistory && report.chatHistory.length > 0) &&
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
  
   if (filteredActiveAssistantChat) {
     if(!allChatItems.some(item => 'history' in item && 'userId' in item && item.userId === filteredActiveAssistantChat.userId && !('name' in item))) {
        allChatItems.unshift(filteredActiveAssistantChat);
     }
  }

  const reportsOnly = filteredReports.filter(r => r.type !== 'assistant');
  const chatItemsCount = allChatItems.length;

  const handleCardClick = (item: Report | AssistantChat) => {
    setSelectedItem(item);
  };

  const handleModalClose = () => {
    setSelectedItem(null);
  };
  
  const handleDeleteReport = (reportId: string) => {
    startTransition(async () => {
      const result = await deleteReportAction(reportId);
      if (result.success) {
        setReports(prev => prev.filter(r => r.id !== reportId));
        toast({ title: 'Success', description: 'Report deleted.' });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
    });
  };

  const handleArchiveChat = () => {
    if (!user) return;
    startTransition(async () => {
      const result = await archiveAssistantChatAction(user.uid);
      if (result.success) {
        // This is tricky because we need to refetch the data.
        // For now, we just remove the chat from the local state.
        // A full page refresh would be the most robust way.
        const archivedChat = assistantChat;
        if(archivedChat) {
             const newReport: Report = {
                id: `archived-${Date.now()}`,
                userId: user.uid,
                name: `Archived AI Assistant Chat`,
                type: 'assistant',
                chatHistory: archivedChat.history,
                createdAt: archivedChat.updatedAt,
             };
             setReports(prev => [newReport, ...prev]);
        }
        setAssistantChat(null);
        toast({ title: 'Success', description: 'Chat has been archived.' });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
    });
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
                Chats ({chatItemsCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
                <HistoryList items={allItems} onCardClick={handleCardClick} onDeleteReport={handleDeleteReport} onArchiveChat={handleArchiveChat} isPending={isPending} />
            </TabsContent>
            <TabsContent value="reports">
                <HistoryList items={reportsOnly} onCardClick={handleCardClick} onDeleteReport={handleDeleteReport} onArchiveChat={handleArchiveChat} isPending={isPending} />
            </TabsContent>
            <TabsContent value="chats">
                 <HistoryList items={allChatItems} onCardClick={handleCardClick} onDeleteReport={handleDeleteReport} onArchiveChat={handleArchiveChat} isPending={isPending} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Dialog open={!!selectedItem} onOpenChange={(isOpen) => !isOpen && handleModalClose()}>
        <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle className="truncate pr-8">{getModalTitle()}</DialogTitle>
            </DialogHeader>
            <div className="flex-grow overflow-hidden">
                <ChatHistory messages={getModalChatHistory()} />
            </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


function HistoryList({ items, onCardClick, onDeleteReport, onArchiveChat, isPending }: { items: (Report | AssistantChat)[], onCardClick: (item: Report | AssistantChat) => void, onDeleteReport: (reportId: string) => void, onArchiveChat: () => void, isPending: boolean }) {
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
                    return <ReportHistoryItem key={item.id || `report-${index}`} report={item} onCardClick={() => onCardClick(item)} onDelete={() => onDeleteReport(item.id)} isPending={isPending} />;
                } else if ('history' in item) { // It's an active AssistantChat
                    return <AssistantChatHistoryItem key={item.userId || `chat-${index}`} chat={item} onCardClick={() => onCardClick(item)} onArchive={onArchiveChat} isPending={isPending} />;
                }
                return null;
            })}
        </div>
    )
}

function ReportHistoryItem({ report, onCardClick, onDelete, isPending }: { report: Report, onCardClick: () => void, onDelete: () => void, isPending: boolean }) {
    const isArchivedChat = report.type === 'assistant';
    const isChat = report.chatHistory && report.chatHistory.length > 0;
    
    let title = report.name;
    let icon = <FileText />;
    let description = "AI-generated summary and analysis.";
    let content = report.summary?.substring(0, 150) + (report.summary && report.summary.length > 150 ? '...' : '');

    if (isArchivedChat) {
        title = "Archived AI Health Assistant";
        icon = <Bot />;
        description = "Archived AI health conversation.";
        const firstUserMessage = report.chatHistory.find(m => m.role === 'user')?.content;
        content = `Started with: "${firstUserMessage?.substring(0, 70) || 'General questions'}${firstUserMessage && firstUserMessage.length > 70 ? '...' : ''}"`;
    } else if (isChat) {
        description = "Conversation about this report.";
        const lastMessage = report.chatHistory[report.chatHistory.length - 1];
        content = `${lastMessage.role === 'user' ? 'You' : 'AI'}: ${lastMessage.content.substring(0, 100)}...`;
    }


    return (
        <Card className="hover:bg-muted/50 transition-colors flex flex-col">
           <div onClick={onCardClick} className="cursor-pointer flex-grow">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            {isChat ? <MessageSquare /> : icon} 
                            {title}
                        </span>
                        <span className="text-sm font-normal text-muted-foreground">
                            <ClientFormattedRelativeTime date={report.createdAt} />
                        </span>
                    </CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{content}</p>
                </CardContent>
            </div>
             <CardFooter className="flex justify-end border-t pt-4 mt-auto">
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            <span className="ml-2">Delete</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this item and its associated history.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => { e.preventDefault(); onDelete(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    )
}

function AssistantChatHistoryItem({ chat, onCardClick, onArchive, isPending }: { chat: AssistantChat, onCardClick: () => void, onArchive: () => void, isPending: boolean }) {
     return (
        <Card className="hover:bg-muted/50 transition-colors flex flex-col">
            <div onClick={onCardClick} className="cursor-pointer flex-grow">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2"><Bot /> AI Health Assistant (Active)</span>
                        <span className="text-sm font-normal text-muted-foreground">
                            <ClientFormattedRelativeTime date={chat.updatedAt} />
                        </span>
                    </CardTitle>
                    <CardDescription>Current general health Q&A conversation.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {chat.history[chat.history.length-1]?.content}
                    </p>
                </CardContent>
            </div>
            <CardFooter className="flex justify-end border-t pt-4 mt-auto">
                 <Button variant="outline" size="sm" onClick={onArchive} disabled={isPending}>
                    {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                    Archive Chat
                </Button>
            </CardFooter>
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

    