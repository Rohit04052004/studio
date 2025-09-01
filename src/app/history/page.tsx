
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, History, ListFilter, MessageSquare, Search } from 'lucide-react';

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState('all');

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
              All (0)
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="mr-2 h-4 w-4" />
              Reports (0)
            </TabsTrigger>
            <TabsTrigger value="chats">
              <MessageSquare className="mr-2 h-4 w-4" />
              Chats (0)
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <Card className="mt-4">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
                <History className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">No items found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your history will appear here as you use the app
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="reports">
             <Card className="mt-4">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
                <History className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">No reports found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your analyzed reports will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="chats">
             <Card className="mt-4">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
                <History className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">No chats found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your chat conversations will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
